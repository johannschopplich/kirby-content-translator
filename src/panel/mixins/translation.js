const QUEUE_LIMIT = 5;

export default {
  methods: {
    async recursiveTranslateContent(
      obj,
      { sourceLanguage, targetLanguage, translatableBlocks = {} },
    ) {
      const tasks = [];

      const handleBlocksField = (blocks) => {
        for (const block of blocks) {
          if (!isObject(block.content) || !block.id || block.isHidden === true)
            continue;

          if (!Object.keys(translatableBlocks).includes(block.type)) continue;

          for (const blockFieldKey of Object.keys(block.content)) {

            // Handle structures
            if (
              isObject(translatableBlocks[block.type]) &&
              !Array.isArray(translatableBlocks[block.type])
            ) {
              for (const [structureKey, fieldKeys] of Object.entries(
                translatableBlocks[block.type]
              )) {
                if (!Array.isArray(fieldKeys)) continue;

                fieldKeys.forEach((fieldKey) => {
                  for (let i = 0; i < block.content[structureKey].length; i++) {
                    const text = block.content[structureKey][i][fieldKey];
                    if (!text) continue;

                    tasks.push(async () => {
                      const response = await window.panel.api.post(
                        "__content-translator__/translate",
                        { sourceLanguage, targetLanguage, text }
                      );
                      block.content[structureKey][i][fieldKey] =
                        response.result.text;
                    });
                  }
                });
              }
              continue;
            }
            
            if (
              !toArray(translatableBlocks[block.type]).includes(blockFieldKey)
            )
              continue;

            if (!block.content[blockFieldKey]) continue;

            // Handle nested blocks
            if (
              Array.isArray(block.content[blockFieldKey]) &&
              block.content[blockFieldKey].every(
                (i) => isObject(i) && i.content,
              )
            ) {
              handleBlocksField(block.content[blockFieldKey]);
              continue;
            }

            tasks.push(async () => {
              const response = await window.panel.api.post(
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
      };

      for (const key in obj) {
        if (!obj[key]) continue;

        // Handle strings as field value
        if (typeof obj[key] === "string") {
          tasks.push(async () => {
            const response = await window.panel.api.post(
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
                const response = await window.panel.api.post(
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
            continue;
          }

          // Detect and handle layout fields
          if (obj[key].every((i) => isObject(i) && i.columns)) {
            for (const layout of obj[key]) {
              for (const column of layout.columns) {
                handleBlocksField(column.blocks);
              }
            }
            continue;
          }

          // Detect and handle block fields
          if (obj[key].every((i) => isObject(i) && i.content)) {
            handleBlocksField(obj[key]);
          }
        }
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
