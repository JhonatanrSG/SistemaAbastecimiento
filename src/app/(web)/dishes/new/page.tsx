// src/app/(web)/dishes/new/page.tsx
import DishForm from '@/components/DishForm';
import RoleGate from '@/components/RoleGate';

export default function NewDishPage() {
  return (
    <RoleGate allow={['CHEF','ADMIN']}>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Registrar plato</h1>
        <DishForm />
      </div>
    </RoleGate>
  );
}
