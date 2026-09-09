import { OperationsShell } from '@/components/operations/OperationsShell';
import { OperationOrderDetailClient } from './operation-order-detail-client';

export default async function OperationOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <OperationsShell>
      <OperationOrderDetailClient orderId={id} />
    </OperationsShell>
  );
}
