import { useCallback } from "react";
import useSWR from "swr";
import { client } from "./client";
import { ExampleRh58osdkTodoProject, exampleRh58CreateOsdkTodoProject, exampleRh58DeleteOsdkTodoProject, exampleRh58UpdateOsdkProjectDescription, osdkTodoTaskSummarisation } from "@tutorial-todo-aip-app/sdk";
import type { PageResult, Osdk } from "@osdk/client";
import type { IProject } from "./types";

function useProjects() {
  const { data, isLoading, isValidating, error, mutate } = useSWR<IProject[]>(
    "projects",
    async () => {
      try {
        const result: PageResult<Osdk.Instance<ExampleRh58osdkTodoProject>> = await client(ExampleRh58osdkTodoProject).fetchPage({
          $orderBy: {"name": "asc"},
          $pageSize: 50,
        });
        const projectsList: IProject[] = result.data.map((project) => ({
          $apiName: project.$apiName,
          $primaryKey: project.$primaryKey,
          id: project.id,
          name: project.name || "",
          description: project.description || "",
          tasks: [], // Initialize with empty array since tasks will be fetched separately
        }));
        return projectsList;
      } catch (error) {
        console.error("Failed to fetch projects", error);
        return [];
      }
    }
  );

  const createProject: (
    name: string,
  ) => Promise<IProject["$primaryKey"]> = useCallback(
    async (name) => {
      const result = await client(exampleRh58CreateOsdkTodoProject).applyAction(
        { name, budget: 50 },
        { $returnEdits: true },
      );
      if (result.type !== "edits") {
        throw new Error("Expected edits to be returned");
      }
      await mutate();
      return result.addedObjects![0].primaryKey as Osdk.Instance<ExampleRh58osdkTodoProject>["$primaryKey"];
    },
    [mutate],
  );

  const updateProjectDescription: (
    project: IProject,
  ) => Promise<void> = useCallback(
    async (project) => {
      // Try to implement this with the Ontology SDK!
      const descriptionResult = await client(osdkTodoTaskSummarisation).executeFunction({ osdkTodoProject: project.$primaryKey });
      const description = descriptionResult;
      await client(exampleRh58UpdateOsdkProjectDescription).applyAction({
        "osdkTodoProject": project.$primaryKey,
        "description": description,
      });
      await mutate();
    },
    [mutate],
  );

  const deleteProject: (project: IProject) => Promise<void> = useCallback(
    async (project) => {
      // Try to implement this with the Ontology SDK!
      await client(exampleRh58DeleteOsdkTodoProject).applyAction({
        "osdkTodoProject": project.$primaryKey,
      });
      await mutate();
    },
    [mutate],
  );

  return {
    projects: data,
    isLoading,
    isValidating,
    isError: error,
    createProject,
    deleteProject,
    updateProjectDescription,
  };
}

export default useProjects;
