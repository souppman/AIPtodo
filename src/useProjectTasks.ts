import { useCallback } from "react";
import useSWR from "swr";
import { client } from "./client";
import { ExampleRh58osdkTodoTask, exampleRh58CreateOsdkTodoTask, exampleRh58DeleteOsdkTodoTask, getTaskDescription } from "@tutorial-todo-aip-app/sdk";
import type { Osdk } from "@osdk/client";
import type { IProject, ITask } from "./types";

/**
 * Converts a date to a local date string, e.g. 2024-10-21
 */
function getLocalDate(date: Date) {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
}

export function useProjectTasks(project: IProject | undefined) {
  const { data, isLoading, isValidating, error, mutate } = useSWR<ITask[]>(
    project != null ? `projects/${project.id}/tasks` : null,
    async () => {
      if (project == null) {
        return [];
      }
      const tasks: ITask[] = [];
      for await (const task of client(ExampleRh58osdkTodoTask).where({projectId: {$eq: project.id}}).asyncIter()) {
        const resultTask: ITask = {
          $apiName: task.$apiName,
          $primaryKey: task.$primaryKey,
          id: task.id,
          title: task.title || "",
          projectId: task.id,
          description: task.description || "",
        };
        tasks.push(resultTask);
      }
      return tasks;
    }
  );

  const createTask: (
    title: string,
    description?: string,
  ) => Promise<ITask["$primaryKey"] | undefined> = useCallback(
    async (title, description) => {
      if (project == null) {
        return undefined;
      }

      const startDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(startDate.getDate() + 7);
      const result = await client(exampleRh58CreateOsdkTodoTask).applyAction(
        {
          title,
          description,
          start_date: getLocalDate(startDate),
          due_date: getLocalDate(dueDate),
          status: "IN PROGRESS",
          project_id: project.$primaryKey,
        },
        { $returnEdits: true },
      );

      if (result.type !== "edits") {
        throw new Error("Expected edits to be returned");
      }

      await mutate();
      return result.addedObjects![0].primaryKey as Osdk.Instance<ExampleRh58osdkTodoTask>["$primaryKey"];
    },
    [project, mutate],
  );

  const deleteTask: (task: ITask) => Promise<void> = useCallback(
    async (task) => {
      if (project == null) {
        return;
      }
      await client(exampleRh58DeleteOsdkTodoTask).applyAction({
        "osdkTodoTask": task.$primaryKey,
      });
      await mutate();
    },
    [project, mutate],
  );

  const getRecommendedTaskDescription: (taskName: string) => Promise<string> =
    useCallback(
      async (taskName: string) => {
        const recommendedTaskDescription = await client(getTaskDescription).executeFunction({taskName});
        await mutate();
        return recommendedTaskDescription;
      },
      [mutate],
    );

  return {
    tasks: data,
    isLoading,
    isValidating,
    isError: error,
    createTask,
    deleteTask,
    getRecommendedTaskDescription,
  };
}
