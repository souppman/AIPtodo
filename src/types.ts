export interface IProject {
  $apiName: string;
  $primaryKey: string;
  id: string;
  name: string;
  description: string;
  tasks: ITask[];
}

export interface ITask {
  $apiName: string;
  $primaryKey: string;
  id: string;
  title: string;
  projectId: string;
  description: string;
} 