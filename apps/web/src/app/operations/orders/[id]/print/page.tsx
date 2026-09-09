import { PrintDocketClient } from './print-docket-client';

export default async function PrintDocketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PrintDocketClient orderId={id} />;
}
