import { useRecurringTemplates } from '../contexts/RecurringTemplatesContext';
import { RecurringPanel } from '../components/RecurringPanel';
import { RecurringSkeleton } from '../components/Skeleton';

export const RecurringPage: React.FC = () => {
  const { templates, loading, cancel } = useRecurringTemplates();

  if (loading && templates.length === 0) {
    return <RecurringSkeleton />;
  }

  return <RecurringPanel templates={templates} onCancel={cancel} />;
};
