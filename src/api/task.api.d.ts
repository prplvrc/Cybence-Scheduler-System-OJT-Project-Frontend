export type TaskPayload = {
  [key: string]: any;
};

export function getTasks(): Promise<any>;
export function createTask(taskData: TaskPayload): Promise<any>;
export function updateTask(id: string | number, taskData: TaskPayload): Promise<any>;
export function deleteTask(id: string | number): Promise<any>;