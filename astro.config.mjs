import { defineConfig } from "astro/config";
import starlight from '@astrojs/starlight';
import react from '@astrojs/react'
import mdx from "@astrojs/mdx";
import starlightLinksValidator from 'starlight-links-validator'
import starlightImageZoom from 'starlight-image-zoom'
import starlightViewModes from 'starlight-view-modes'
import partytown from '@astrojs/partytown'
import sitemap from '@astrojs/sitemap';

const site = 'https://starter.obytes.com/';
//@see: https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      components: {
        Header: './src/components/Header.astro',
      },
      customCss: [
        // Relative path to your custom CSS file
        "./src/styles/custom.css",
        // "./src/styles/custom_old.css",
        // "./src/styles/custom_slint.css",
      ],
      lastUpdated: true,
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
      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: site + 'og.jpg?v=1' },
        },
        {
          tag: 'meta',
          attrs: { property: 'twitter:image', content: site + 'og.jpg?v=1' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossorigin: true,
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&display=swap',
          },
        },
        {
          tag: 'script',
          attrs: {
            src: 'https://cdn.jsdelivr.net/npm/@minimal-analytics/ga4/dist/index.js',
            async: true,
          },
        },
        {
          tag: 'script',
          content: ` window.minimalAnalytics = {
            trackingId: 'G-GQ45JJD1JC',
            autoTrack: true,
          };`,
        },
      ],
      title: 'My Docs',
      social: {
        github: 'https://github.com/withastro/starlight',
      },
      //TODO: add the head property.
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
          label: 'Components',
          autogenerate: { directory: 'components' },
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
    }),
  ],
});
