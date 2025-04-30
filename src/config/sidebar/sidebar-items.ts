import componentTopic from "./components-topic.ts";
import guidesTopic from "./guides-topic.ts";
import referencesTopic from "./references-topic.ts";

/*
You can add more topics here as needed. Create a new file for each topic in the sidebar folder and import it here.
 Example:
 --------
 import anotherTopic from "./another-topic.ts";
*/

export default [
  ...guidesTopic,
  ...componentTopic,
  ...referencesTopic,

  // Add another topic to the sidebar. Example:
  // ...anotherTopic,
]

