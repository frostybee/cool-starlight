# Starlight Starter Kit: Basics

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/starlight/tree/main/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/starlight/tree/main/examples/basics)

---
> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!
---

## Getting Started

1. **Clone the repository**  
    - Run the following command to clone the repository to your local machine:  

        ```bash
        git clone https://github.com/frostybee/cool-starlight.git
        cd cool-starlight
        ```

    - Or download it as a .zip file) and run: `npm install`

2. **Install dependencies**  
    Use npm to install the required dependencies:  

    ```bash
    npm install
    ```

3. **Start the development server**  
    Launch the local development server:  

    ```bash
    npm run dev
    ```

4. **Open in your browser**  
    Navigate to `http://localhost:4321` in your browser to view your project.

5. **Build for production** (optional if you are using CI to deploy your project)  
    When you're ready to deploy, build the project with:  

    ```bash
    npm run build
    ```

    The output will be located in the `./dist/` directory.

## 🚀 Project Structure

Inside of your **Cool Starlight** project, you'll see the following folders and files:

```
.
├── public/
├── src/
│   ├── assets/
│   ├── components/ 👈 Contains overrides of Astro components
│   ├── content/
│   │   ├── docs/   👈 Your website content goes here
│   │   └── config.ts
│   ├── config
│   ├── ├── sidebar/
│   │   ├─────────  sidebar-items.ts   👈 Use this file to store the items/links to be displayed in the left sidebar.        
│   └── env.d.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

- Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on its file name.

- Images can be added to `src/assets/` and embedded in Markdown with a relative link.

- Static assets, like favicons, can be placed in the `public/` directory.

- The items to be displayed in the left sidebar are configured in the `src/config/sidebar` file.

## Features

- Image zoom
- Sidebar topics (Organize items by topics)
- Custom font (headings and markdown content)
- Page scroll indicator  

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [Starlight’s docs](https://starlight.astro.build/), read [the Astro documentation](https://docs.astro.build), or jump into the [Astro Discord server](https://astro.build/chat).
