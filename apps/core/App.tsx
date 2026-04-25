import './global.css';

import { RootTabs } from './src/navigation/RootTabs';
import { AppProviders } from './src/providers/AppProviders';

export default function App() {
  return (
    <AppProviders>
      <RootTabs />
    </AppProviders>
  );
}
