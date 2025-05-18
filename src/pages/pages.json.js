import { getCollection } from 'astro:content';

export async function GET() {
  try {
    // Get all doc pages from Starlight collection
    const allPages = await getCollection('docs');

    // Transform into a format suitable for the Telescope component
    const formattedPages = allPages.map(page => {
      return {
        title: page.data.title,
        // Use the current origin and base path instead of hardcoding
        path: `${page.slug}`,
        description: page.data.description || '',
        // You can add more metadata as needed
        tags: page.data.tags || [],
        category: page.data.category || '',
      };
    });

    // Return as JSON
    return new Response(JSON.stringify(formattedPages), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating pages.json:', error);
    return new Response(JSON.stringify({ error: 'Error generating pages data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
