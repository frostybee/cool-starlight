import { defineConfig } from "astro/config";
import starlight from '@astrojs/starlight';
import starlightImageZoom from 'starlight-image-zoom'
import rehypeExternalLinks from "rehype-external-links";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from 'rehype-slug';
import starlightSidebarTopics from "starlight-sidebar-topics";
import starlightLinksValidator from 'starlight-links-validator'
import starlightViewModes from 'starlight-view-modes'

import leftSidebar from './src/config/sidebar/sidebar-items.ts'
import websiteConfig from './src/config/website-config.ts'

//@see: https://astro.build/config
export default defineConfig({
  site: websiteConfig.siteURI,
  base: websiteConfig.baseDirectory,
  integrations: [
    starlight({
      title: websiteConfig.title,
      favicon: websiteConfig.favicon,
      social: [
        { icon: 'github', label: 'GitHub', href: websiteConfig.gitHubRepoUri },
      ],
      tableOfContents: {minHeadingLevel: 2, maxHeadingLevel: 4},
      //TODO: add the head property.
      defaultLocale: "en",
      components: {
        Header: './src/components/Header.astro',
      },
      // Load and apply the default custom styles.
      customCss: [
        "./src/styles/index.css",
      ],
      lastUpdated: true,
      plugins: [
        starlightImageZoom(),
        starlightSidebarTopics(
          [
            // Load the sidebar items from the ./src/config/sidebar/sidebar-items.ts file.
            ...leftSidebar
          ],

          //FIXME: the starlightViewModes plugin is buggy and it doesn't work as expected.
          // {
          //   exclude: ["/zen-mode/**/*"],
			    // }
        )
      ],

      //TODO: enable the links validator plugin when the site is ready for production or if you want to validate the links in the site.
      // plugins: [
      //   starlightLinksValidator({
      //     errorOnFallbackPages: false,
      //   }),
      // ],
    }
    ),
  ],
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      rehypeHeadingIds,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      [rehypeExternalLinks,
        {
          content: {
            type: "text",
            value: " ↗",
          },
          properties: {
            target: "_blank",
          },
          rel: ["noopener"],
        },
      ],
    ],
  },
});



