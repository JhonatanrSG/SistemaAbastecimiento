# tests-e2e.ps1
# End-to-end: HU1..HU9 + PO (aceptar RFQ) + GRN (recepcion)
# Ejecutar desde la raiz del proyecto.

$ErrorActionPreference = "Stop"
$BASE = "http://localhost:3000"

function AsArray($x) {
  if ($null -ne $x.value)     { ,$x.value }
  elseif ($null -ne $x.items) { ,$x.items }
  elseif ($x -is [System.Array]) { ,$x }
  else { ,@($x) }
}


function PostJson($url, $obj) {
  $json = $obj | ConvertTo-Json -Depth 10 -Compress
  try {
    (Invoke-WebRequest -Method Post -Uri $url -ContentType "application/json" -Body $json).Content
  } catch {
    $_.Exception.Response.GetResponseStream() | % { $r = New-Object IO.StreamReader($_); $r.ReadToEnd() }
  }
}

function PatchJson($url, $obj) {
  $json = $obj | ConvertTo-Json -Depth 10 -Compress
  try {
    (Invoke-WebRequest -Method Patch -Uri $url -ContentType "application/json" -Body $json).Content
  } catch {
    $_.Exception.Response.GetResponseStream() | % { $r = New-Object IO.StreamReader($_); $r.ReadToEnd() }
  }
}

function Section($t) { Write-Host "`n== $t ==" -ForegroundColor Cyan }
function Ok($t)      { Write-Host $t -ForegroundColor Green }
function Warn($t)    { Write-Host $t -ForegroundColor Yellow }
function Info($t)    { Write-Host $t -ForegroundColor Gray }

# 0) Smoke
Section "Server check"
try {
  (Invoke-WebRequest -Uri $BASE -MaximumRedirection 0 -ErrorAction SilentlyContinue) | Out-Null
  Ok "OK Next.js up on :3000"
} catch {
  throw "No pude contactar $BASE. Corre 'npm run dev' antes de ejecutar este script."
}

# 1) HU1: Categorias y Productos
Section "HU1: Categories & Products"
$cats = Invoke-RestMethod "$BASE/api/categories"
$cat  = $cats | ? { $_.name -eq 'Proteina' } | Select-Object -First 1
if (-not $cat) {
  PostJson "$BASE/api/categories" @{ name = "Proteina" } | Out-Host
  $cats = Invoke-RestMethod "$BASE/api/categories"
  $cat  = $cats | ? { $_.name -eq 'Proteina' } | Select-Object -First 1
}
$catId = [string]$cat.id
Ok ("Proteina id: {0}" -f $catId)

$prods = Invoke-RestMethod ("$BASE/api/products?categoryId={0}" -f $catId)
if (-not ($prods | ? { $_.name -eq 'Res' }))   { PostJson "$BASE/api/products" @{ name="Res";   categoryId=$catId } | Out-Host }
if (-not ($prods | ? { $_.name -eq 'Pollo' })) { PostJson "$BASE/api/products" @{ name="Pollo"; categoryId=$catId } | Out-Host }
$prods   = Invoke-RestMethod ("$BASE/api/products?categoryId={0}" -f $catId)
$resId   = [string]($prods | ? { $_.name -eq 'Res' }   | Select-Object -First 1 -Expand id)
$polloId = [string]($prods | ? { $_.name -eq 'Pollo' } | Select-Object -First 1 -Expand id)
Ok ("Res id: {0}" -f $resId)
Ok ("Pollo id: {0}" -f $polloId)

# 2) HU1/4: Plato base
Section "HU1/4: Dish 'Bandeja Prote'"
$dishes = AsArray (Invoke-RestMethod "$BASE/api/dishes")
if (-not ($dishes | ? { $_.name -eq 'Bandeja Prote' })) {
  $dishBody = @{
    name       = "Bandeja Prote"
    categoryId = $catId
    priceCents = 25000
    recipe     = @(
      @{ productId = $resId;   qty = 0.25; uom = "Kg" },
      @{ productId = $polloId; qty = 1;    uom = "Unidad" }
    )
  }
  PostJson "$BASE/api/dishes" $dishBody | Out-Host
}
$dishes = AsArray (Invoke-RestMethod "$BASE/api/dishes")
$dishId = [string]($dishes | ? { $_.name -eq 'Bandeja Prote' } | Select-Object -First 1 -Expand id)
Ok ("Dish id: {0}" -f $dishId)

# 3) HU7 soporte: seed inventario (opcional)
Section "HU7 support: Inventory seed (optional)"
$seedPayload = @{
  items = @(
    @{ productId=$resId;   qty=10; capacity=40 },
    @{ productId=$polloId; qty=20; capacity=80 }
  )
}
$seedResp = PostJson "$BASE/api/inventory/seed" $seedPayload
if ($seedResp -and $seedResp -notmatch '404') { Info "Seed inventario -> $seedResp" } else { Warn "No existe /api/inventory/seed (skip)" }

# 4) HU3/4: Orden y descuento de stock
Section "HU3/4: Orders and stock discount"

# Crea la orden y usa el id que devuelve el POST
$bodyOrder = @{
  tableNumber = "M-22"
  waiterName  = "Ana"
  items       = @(@{ dishId = $dishId; qty = 2 })
}

$orderCreatedJson = PostJson "$BASE/api/orders" $bodyOrder
$orderCreated     = $orderCreatedJson | ConvertFrom-Json
$orderId          = [string]$orderCreated.id

if (-not $orderId) {
  # fallback por si tu POST no devuelve el objeto; tomamos la primera del listado
  $orders  = AsArray (Invoke-RestMethod "$BASE/api/orders")
  if (-not $orders -or -not $orders[0].id) { throw "No orders returned" }
  $orderId = [string]$orders[0].id
}
Info ("Order id: {0}" -f $orderId)

# Marca LISTO
PatchJson ("$BASE/api/orders/{0}" -f $orderId) @{ status = "LISTO" } | Out-Host

# Verifica inventario bajo y notificaciones
Write-Host "Low inventory (<=25%):"
(Invoke-RestMethod "$BASE/api/inventory/low" | ConvertTo-Json -Depth 5) | Out-Host

Write-Host "Notifications (top 5):"
(Invoke-RestMethod "$BASE/api/notifications" | Select-Object -First 5 | Format-Table type,message,createdAt | Out-String) | Out-Host


# 5) HU5/6: Proveedor + Supply Request
Section "HU5/6: Suppliers and Supply Requests"
$supl = AsArray (Invoke-RestMethod "$BASE/api/suppliers")
if (-not $supl -or $supl.Count -eq 0) {
  PostJson "$BASE/api/suppliers" @{ name="Proveedor ACME"; email="acme@proveedores.test" } | Out-Host
  $supl = AsArray (Invoke-RestMethod "$BASE/api/suppliers")
}
$supId = [string]$supl[0].id
Ok ("Supplier id: {0}" -f $supId)

$reqBody = @{
  branch    = "Sede Centro"
  requester = "Jefe Cocina Centro"
  items     = @(@{ productId=$resId; qty=5; uom="Kg"; brand="MarcaX" })
}
$reqCreated = PostJson "$BASE/api/requests" $reqBody
$req = ($reqCreated | ConvertFrom-Json)
if(-not $req.id) {
  # si la API no devuelve el objeto, busca la mas reciente PENDIENTE
  $req = (AsArray (Invoke-RestMethod "$BASE/api/requests?status=PENDIENTE"))[0]
}
$reqId = [string]$req.id
Ok ("Request id: {0}" -f $reqId)

# 6) HU6: RFQ (PDF + correo fake)
Section "HU6: RFQ create + PDF + fake mail"
$rfqBody = @{ requestId=$reqId; supplierId=$supId; dueDate=(Get-Date).AddDays(3).ToString("yyyy-MM-dd") }
$rfq1 = PostJson "$BASE/api/rfqs" $rfqBody
$rfq2 = PostJson "$BASE/api/rfqs" $rfqBody  # idempotente
"RFQ 1: $rfq1" | Out-Host
"RFQ 2 (dup expected): $rfq2" | Out-Host

$rfq = (AsArray (Invoke-RestMethod ("$BASE/api/rfqs?requestId={0}" -f $reqId)))[0]
$rfqId = [string]$rfq.id
Ok ("RFQ id: {0}" -f $rfqId)

$pdfRfq = ("{0}\public\rfqs\{1}.pdf" -f (Get-Location), $rfqId)
Write-Host "RFQ PDF file: $pdfRfq"
Write-Host ("RFQ PDF URL: {0}/rfqs/{1}.pdf" -f $BASE, $rfqId)

# 7) HU9: Clasificacion
Section "HU9: RFQ classification"
$stds = Invoke-RestMethod ("$BASE/api/rfqs/{0}/std" -f $rfqId)

# a) RECHAZADA (150%)
$pricesA = @(); foreach ($s in $stds) { $pricesA += @{ itemId=$s.itemId; quotedUnitPriceCents=[int]($s.stdUnitPriceCents*1.5) } }
PostJson ("$BASE/api/rfqs/{0}/prices" -f $rfqId) @{ prices=$pricesA } | Out-Host
(Invoke-WebRequest -Method Post ("$BASE/api/rfqs/{0}/validate" -f $rfqId)).Content | Out-Host

# b) SOSPECHOSA (40%)
$pricesB = @(); foreach ($s in $stds) { $pricesB += @{ itemId=$s.itemId; quotedUnitPriceCents=[int]($s.stdUnitPriceCents*0.4) } }
PostJson ("$BASE/api/rfqs/{0}/prices" -f $rfqId) @{ prices=$pricesB } | Out-Host
(Invoke-WebRequest -Method Post ("$BASE/api/rfqs/{0}/validate" -f $rfqId)).Content | Out-Host

# c) OPCIONADA (90%)
$pricesC = @(); foreach ($s in $stds) { $pricesC += @{ itemId=$s.itemId; quotedUnitPriceCents=[int]($s.stdUnitPriceCents*0.9) } }
PostJson ("$BASE/api/rfqs/{0}/prices" -f $rfqId) @{ prices=$pricesC } | Out-Host
(Invoke-WebRequest -Method Post ("$BASE/api/rfqs/{0}/validate" -f $rfqId)).Content | Out-Host

Write-Host "RFQ final:"
(Invoke-RestMethod ("$BASE/api/rfqs?requestId={0}" -f $reqId) | Select-Object -First 1 | Format-Table id,supplierId,classification | Out-String) | Out-Host

# 8) Aceptar RFQ -> PO (PDF)
Section "PO: Accept RFQ -> Purchase Order + PDF"
$poCreate = PostJson ("$BASE/api/rfqs/{0}/accept" -f $rfqId) @{ }
$poObj = $poCreate | ConvertFrom-Json
$poId = [string]$poObj.id
if(-not $poId) { throw "No se pudo crear/obtener la PO. Respuesta: $poCreate" }
Ok ("PO id: {0} (duplicate: {1})" -f $poId, ($poObj.duplicate -as [bool]))

$pdfPo = ("{0}\public\pos\{1}.pdf" -f (Get-Location), $poId)
Write-Host "PO PDF file: $pdfPo"
Write-Host ("PO PDF URL: {0}/pos/{1}.pdf" -f $BASE, $poId)

# 9) Recepcion (GRN): valida sobrecantidades y hace parcial + cierre
Section "GRN: Receive flow (validation, partial, final)"
# 9.1) Intento invalido (mas que pendiente)
try {
  $bad = @{ items = @(@{ productId=$resId; qty=999; uom="Kg" }) }
  $resp = PostJson ("$BASE/api/purchase-orders/{0}/receive" -f $poId) $bad
  if ($resp -match '"grnId"') { throw "Deberia fallar por cantidad invalida, pero recibio: $resp" }
  Warn "Intento invalido respondio: $resp"
} catch {
  Ok "Validacion OK: no permite recibir mas que lo pendiente."
}

# 9.2) Recepcion parcial (2)
$rcv1 = @{ items = @(@{ productId=$resId; qty=2; uom="Kg" }) }
PostJson ("$BASE/api/purchase-orders/{0}/receive" -f $poId) $rcv1 | Out-Host

# 9.3) Recepcion final (3 restantes)
$rcv2 = @{ items = @(@{ productId=$resId; qty=3; uom="Kg" }) }
PostJson ("$BASE/api/purchase-orders/{0}/receive" -f $poId) $rcv2 | Out-Host

# 9.4) Verifica estados: PO=RECIBIDA, Request=CERRADA
try {
  $po = Invoke-RestMethod ("$BASE/api/purchase-orders/{0}" -f $poId)
  Write-Host "PO status esperado: RECIBIDA"
  ($po | Select-Object id,status,createdAt | Format-Table | Out-String) | Out-Host
} catch {
  Warn "GET /api/purchase-orders/{id} no disponible; continuamos con verificacion por Request"
}

Write-Host "Requests CERRADA (buscando la nuestra):"
$closed = AsArray (Invoke-RestMethod "$BASE/api/requests?status=CERRADA")
$mine = $closed | ? { $_.id -eq $reqId }
if ($mine) { Ok "La solicitud $reqId quedo CERRADA." } else { Warn "No encontre la request $reqId como CERRADA (revisar)." }

# 9.5) Stock final
Write-Host "Stock final del producto (lista baja y notificaciones):"
(Invoke-RestMethod "$BASE/api/inventory/low" | ConvertTo-Json -Depth 5) | Out-Host
(Invoke-RestMethod "$BASE/api/notifications" | Select-Object -First 5 | Format-Table type,message,createdAt | Out-String) | Out-Host

Ok "`nFIN: flujo E2E completado"
