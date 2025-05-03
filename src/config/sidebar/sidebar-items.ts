import componentTopic from "./components-topic.ts";
import guidesTopic from "./guides-topic.ts";
import referencesTopic from "./references-topic.ts";

/*
 You can add more topics here as needed. Create a new file for each topic in the sidebar folder and import it here.
 Example:
 --------
 import anotherTopic from "./another-topic.ts";

 Note:
 -----
 - This configuration is based on the starlight-sidebar-topics plugin.
   @see: https://starlight-sidebar-topics.netlify.app/docs/getting-started/
*/

export default [
  ...guidesTopic,
  ...componentTopic,
  ...referencesTopic,

  // Add another topic to the sidebar. Example:
  // ...anotherTopic,
]

