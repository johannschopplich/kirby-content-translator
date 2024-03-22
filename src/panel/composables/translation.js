import { useApi } from "kirbyuse";
import pAll from "p-all";
import { TRANSLATION_API_ROUTE } from "../constants";

export function useTranslation() {
  const api = useApi();

  const recursiveTranslateContent = async (
    obj,
    {
      sourceLanguage,
      targetLanguage,
      translatableStructureFields = [],
      translatableBlocks = {},
    },
  ) => {
    const tasks = [];

    const handleStructureField = (
      /** @type {Record<string, any[]>} */
      structure,
    ) => {
      for (const structureItem of structure) {
        for (const key in structureItem) {
          if (!translatableStructureFields.includes(key)) continue;
          if (!structureItem[key]) continue;

          // Handle strings as field value
          if (typeof structureItem[key] === "string") {
            tasks.push(async () => {
              const response = await api.post(TRANSLATION_API_ROUTE, {
                sourceLanguage,
                targetLanguage,
                text: structureItem[key],
              });
              structureItem[key] = response.text;
            });
          }

          // Handle array as field value
          else if (Array.isArray(structureItem[key])) {
            // Handle array of strings
            if (structureItem[key].every((i) => typeof i === "string")) {
              tasks.push(async () => {
                for (const index in structureItem[key]) {
                  if (!structureItem[key][index]) continue;

                  const response = await api.post(TRANSLATION_API_ROUTE, {
                    sourceLanguage,
                    targetLanguage,
                    text: structureItem[key][index],
                  });
                  structureItem[key][index] = response.text;
                }
              });
            }
          }
        }
      }
    };

    const handleBlocksField = (
      /** @type {Record<string, any[]>} */
      blocks,
    ) => {
      for (const block of blocks) {
        if (!isObject(block.content) || !block.id || block.isHidden === true)
          continue;

        if (!Object.keys(translatableBlocks).includes(block.type)) continue;

        for (const blockFieldKey of Object.keys(block.content)) {
          if (!toArray(translatableBlocks[block.type]).includes(blockFieldKey))
            continue;

          if (!block.content[blockFieldKey]) continue;

          // Handle nested blocks
          if (
            Array.isArray(block.content[blockFieldKey]) &&
            block.content[blockFieldKey].every((i) => isObject(i) && i.content)
          ) {
            handleBlocksField(block.content[blockFieldKey]);
            continue;
          }

          // Handle structures in blocks
          if (
            Array.isArray(block.content[blockFieldKey]) &&
            block.content[blockFieldKey].every(
              (i) =>
                isObject(i) &&
                Object.keys(i).some((j) =>
                  translatableStructureFields.includes(j),
                ),
            )
          ) {
            handleStructureField(block.content[blockFieldKey]);
            continue;
          }

          tasks.push(async () => {
            const response = await api.post(TRANSLATION_API_ROUTE, {
              sourceLanguage,
              targetLanguage,
              text: block.content[blockFieldKey],
            });
            block.content[blockFieldKey] = response.text;
          });
        }
      }
    };

    for (const key in obj) {
      if (!obj[key]) continue;

      // Handle strings as field value
      if (typeof obj[key] === "string") {
        tasks.push(async () => {
          const response = await api.post(TRANSLATION_API_ROUTE, {
            sourceLanguage,
            targetLanguage,
            text: obj[key],
          });
          obj[key] = response.text;
        });
      }

      // Handle array as field value
      else if (Array.isArray(obj[key]) && obj[key].length > 0) {
        // Handle array of strings
        if (obj[key].every((i) => typeof i === "string")) {
          obj[key] = await Promise.all(
            obj[key].filter(Boolean).map(async (item) => {
              const response = await api.post(TRANSLATION_API_ROUTE, {
                sourceLanguage,
                targetLanguage,
                text: item,
              });
              return response.text;
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

        // Detect and handle structure fields
        if (
          obj[key].every(
            (i) =>
              isObject(i) &&
              Object.keys(i).some((j) =>
                translatableStructureFields.includes(j),
              ),
          )
        ) {
          handleStructureField(obj[key]);
          continue;
        }
      }
    }

    // Process translation tasks in batches
    try {
      await pAll(tasks, { concurrency: 5 });
    } catch (error) {
      console.error(error);
      throw error;
    }

    return obj;
  };

  return {
    recursiveTranslateContent,
  };
}

function toArray(value) {
  value = value ?? [];
  return Array.isArray(value) ? value : [value];
}

function isObject(value) {
  return typeof value === "object" && value !== null;
}
