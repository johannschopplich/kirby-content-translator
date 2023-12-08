const QUEUE_LIMIT = 5;

export default {
  methods: {
    async recursiveTranslateContent(
      obj,
      { sourceLanguage, targetLanguage, translatableBlocks = {} },
    ) {
      const tasks = [];

      for (const key in obj) {
        if (!obj[key]) continue;

        // Handle strings as field value
        if (typeof obj[key] === "string") {
          tasks.push(async () => {
            const response = await this.$api.post(
              "__content-translator__/translate",
              {
                sourceLanguage,
                targetLanguage,
                text: obj[key],
              },
            );
            obj[key] = response.result.text;
          });
        }

        // Handle array as field value
        else if (Array.isArray(obj[key])) {
          // Handle array of strings
          if (obj[key].every((i) => typeof i === "string")) {
            obj[key] = await Promise.all(
              obj[key].filter(Boolean).map(async (item) => {
                const response = await this.$api.post(
                  "__content-translator__/translate",
                  {
                    sourceLanguage,
                    targetLanguage,
                    text: item,
                  },
                );
                return response.result.text;
              }),
            );
          } else {
            // Detect and handle fields inside blocks
            for (const block of obj[key]) {
              if (
                !isObject(block.content) ||
                !block.id ||
                block.isHidden === true
              )
                continue;

              if (!Object.keys(translatableBlocks).includes(block.type))
                continue;

              for (const blockFieldKey of Object.keys(block.content)) {
                if (
                  !toArray(translatableBlocks[block.type]).includes(
                    blockFieldKey,
                  )
                )
                  continue;

                if (!block.content[blockFieldKey]) continue;

                tasks.push(async () => {
                  const response = await this.$api.post(
                    "__content-translator__/translate",
                    {
                      sourceLanguage,
                      targetLanguage,
                      text: block.content[blockFieldKey],
                    },
                  );
                  block.content[blockFieldKey] = response.result.text;
                });
              }
            }
          }
        }

        // Recursively process nested objects
        // else if (typeof obj[key] === "object" && obj[key] !== null) {
        //   obj[key] = await this.recursiveTranslateContent(obj[key], {
        //     targetLanguage,
        //     translatableBlocks,
        //   });
        // }
      }

      // Process translation tasks in batches
      try {
        await processInBatches(tasks);
      } catch (error) {
        console.error(error);
        throw error;
      }

      return obj;
    },
  },
};

async function processInBatches(tasks, limit = QUEUE_LIMIT) {
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    await Promise.all(batch.map((task) => task()));
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

function isObject(value) {
  return typeof value === "object" && value !== null;
}
