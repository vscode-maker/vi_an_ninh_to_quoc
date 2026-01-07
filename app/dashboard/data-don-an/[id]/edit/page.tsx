
import { notFound } from 'next/navigation';
import { getDataDonAnById } from '@/lib/actions/data-don-an';
import DataDonAnForm from '@/components/data-don-an/data-don-an-form';

export default async function EditDataDonAnPage({
    params
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const item = await getDataDonAnById(id);

    if (!item) {
        notFound();
    }

    return (
        <div style={{ padding: '24px' }}>
            <DataDonAnForm initialData={item} isEdit={true} />
        </div>
    );
}
