/*
- This configuration is based on the starlight-sidebar-topics plugin.
  @see: https://starlight-sidebar-topics.netlify.app/docs/getting-started/
*/
export default
  [
    {
      label: "Guides",
      link: "/guides/example",
      icon: "open-book",
      items: [
        // Each item here is one entry in the navigation menu.
        {
          label: "Basic Elements",
          autogenerate: {
            directory: "guides/",
          }
        }
        ],
    },
  ];
