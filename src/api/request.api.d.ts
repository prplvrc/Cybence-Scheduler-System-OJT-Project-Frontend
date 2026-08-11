export function getRequests(): Promise<any>;
export function getRequestById(id: string | number): Promise<any>;
export function createRequest(requestData: any): Promise<any>;
export function updateRequest(id: string | number, requestData: any): Promise<any>;
export function deleteRequest(id: string | number): Promise<any>;
export function approveRequest(id: string | number): Promise<any>;
export function rejectRequest(id: string | number): Promise<any>;