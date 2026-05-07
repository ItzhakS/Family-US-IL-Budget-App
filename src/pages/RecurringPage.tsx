import { useRecurringTemplates } from '../contexts/RecurringTemplatesContext';
import { RecurringPanel } from '../components/RecurringPanel';

export const RecurringPage: React.FC = () => {
  const { templates, cancel } = useRecurringTemplates();

  return <RecurringPanel templates={templates} onCancel={cancel} />;
};
