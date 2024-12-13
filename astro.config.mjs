import starlight from '@astrojs/starlight';
import { defineConfig } from "astro/config";
import react from '@astrojs/react'
import mdx from "@astrojs/mdx";
import starlightLinksValidator from 'starlight-links-validator'
import starlightImageZoom from 'starlight-image-zoom'
import starlightViewModes from 'starlight-view-modes'
import partytown from '@astrojs/partytown'
import sitemap from '@astrojs/sitemap';

//@see: https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'My Docs',
      social: {
        github: 'https://github.com/withastro/starlight',
      },
      customCss: [
        // Relative path to your custom CSS file
        "./src/styles/custom.css",
      ],
      plugins: [
        starlightImageZoom(),
        starlightViewModes()
      ],
      // plugins: [
      //   starlightLinksValidator({
      //     errorOnFallbackPages: false,
      //   }),
      // ],

      // Code block style
      // @doc: https://expressive-code.com/installation/
      expressiveCode: {
        defaultProps: {
          wrap: true
        },
        styleOverrides: {
          borderColor: 'transparent',
          borderRadius: 'var(--border-radius)',
          // frames: {
          //   shadowColor: '#e0f7fa',
          // }
        },

        // For more themes:
        //@see: https://expressive-code.com/guides/themes/
        themes: ['dracula', 'catppuccin-latte'],
      },

      // Set English as the default language for this site.
      defaultLocale: "en",

      sidebar: [
        {
          label: 'Guides',
          items: [
            // Each item here is one entry in the navigation menu.
            { label: 'Example Guide', slug: 'guides/example' },
          ],
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
});
