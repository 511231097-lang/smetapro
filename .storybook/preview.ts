import type { Preview } from 'storybook-react-rsbuild';
import '../src/tokens/typography-vars.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
