import { OperationsShell } from '@/components/operations/OperationsShell';
import { OperationsDashboardClient } from './operations-dashboard-client';

export default function OperationsPage() {
  return (
    <OperationsShell>
      <OperationsDashboardClient />
    </OperationsShell>
  );
}
