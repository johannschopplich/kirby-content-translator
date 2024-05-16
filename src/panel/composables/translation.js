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
      fields = {},
      translatableStructureFields = [],
      translatableObjectFields = [],
      translatableBlocks = {},
    },
  ) => {
    const tasks = [];

    const handleGenericObject = (
      /** @type {Record<string, any[]>} */
      item,
      /** @type {string[]} */
      translatableFields,
    ) => {
      for (const key in item) {
        if (!translatableFields.includes(key)) continue;
        if (!item[key]) continue;

        // Handle strings as field value
        if (typeof item[key] === "string") {
          tasks.push(async () => {
            const response = await api.post(TRANSLATION_API_ROUTE, {
              sourceLanguage,
              targetLanguage,
              text: item[key],
            });
            item[key] = response.text;
          });
        }

        // Handle arrays as field value
        else if (Array.isArray(item[key])) {
          // Handle array of strings
          if (item[key].every((i) => typeof i === "string")) {
            tasks.push(async () => {
              for (const index in item[key]) {
                if (!item[key][index]) continue;

                const response = await api.post(TRANSLATION_API_ROUTE, {
                  sourceLanguage,
                  targetLanguage,
                  text: item[key][index],
                });
                item[key][index] = response.text;
              }
            });
          }
        }
      }
    };

    const handleStructureField = (
      /** @type {Record<string, any[]>} */
      structure,
    ) => {
      for (const structureItem of structure) {
        handleGenericObject(structureItem, translatableStructureFields);
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
            block.content[blockFieldKey].every((i) => isObject(i))
          ) {
            handleStructureField(block.content[blockFieldKey]);
            continue;
          }

          // Handle object fields in blocks
          if (isObject(block.content[blockFieldKey])) {
            handleGenericObject(
              block.content[blockFieldKey],
              translatableObjectFields,
            );
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

      // Handle arrays as field value
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
        if (fields[key]?.type === "layout") {
          for (const layout of obj[key]) {
            for (const column of layout.columns) {
              handleBlocksField(column.blocks);
            }
          }
          continue;
        }

        // Detect and handle block fields
        if (fields[key]?.type === "blocks") {
          handleBlocksField(obj[key]);
        }

        // Detect and handle structure fields
        if (fields[key]?.type === "structure") {
          handleStructureField(obj[key]);
          continue;
        }
      }

      // Detect and handle object fields
      if (fields[key]?.type === "object" && isObject(obj[key])) {
        handleGenericObject(obj[key], translatableObjectFields);
        continue;
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
