export type IssueStatus = "Open" | "Closed";

export type IssueHistory = {
  date: string;
  user: string;
  summary: string;
};

export type IssueRecord = {
  id: number;
  incomingDesignId: string | null;
  projectCode: string;
  source: string;
  partCode: string;
  productDescription: string;
  dateFound: string;
  errorDescription: string;
  category: string;
  preparedBy: string;
  foundBy: string;
  action: string;
  targetDate: string;
  status: IssueStatus;
  dateClosed: string;
  remark: string;
  history: IssueHistory[];
};


export type IssueFormValues = Omit<IssueRecord, "id" | "history">;
