export interface Job {
  title: string;
  company: string;
  url: string;
  location: string;
  description: string;
  source: string;
  postedAt?: string;
  tags?: string[];
}
