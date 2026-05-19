export interface Job {
  title: string;
  company: string;
  url: string;
  location: string;
  description: string;
  source: string;
  jobId?: string;
  postedAt?: string;
  salary?: string;
  category?: string;
  badge?: string;
  easyApply?: boolean;
  logoUrl?: string;
  tags?: string[];
  // from details scrape
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  deadline?: string;
  applyUrl?: string;
  // tracking
  appliedAt?: string;
  status?: "new" | "applied" | "rejected" | "interview";
}
