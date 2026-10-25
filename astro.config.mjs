// Static build: one page that reads the table or menu token from the URL (/t/<token>, /m/<token>), so any static
// host works. src/shared holds the money, numeral and id code the app uses, copied so the page builds on its own.
import { defineConfig } from 'astro/config';

export default defineConfig({ output: 'static' });
