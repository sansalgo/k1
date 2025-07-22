/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      typography: () => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": "var(--color-color-10)",
            "--tw-prose-bullets": "var(--color-color-10)",
            "--tw-prose-bold": "var(--color-color-10)",
            "--tw-prose-links": "var(--color-link-1)",
          },
        },
      }),
    },
  },
};
