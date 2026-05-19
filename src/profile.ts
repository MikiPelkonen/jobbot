import { parse } from "smol-toml";

export interface Profile {
  hobbies?: string[];

  dev_environment?: string[];

  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;

    summary?: string;

    github?: string;
    website?: string;
  };

  languages: {
    list: string[];
  };

  education: {
    entry: string;
  }[];

  recent_role: {
    title: string;
    company: string;
    period: string;
    end_reason: string;
    duties: string[];
  };

  previous_experience: {
    entry: string;
  }[];

  skills: Record<string, string[]>;

  target: {
    roles: string[];
    location_preference: string;
  };

  emphasis?: {
    lead_with?: string;
    highlight_skills?: string[];
  };

  search: {
    queries: string[];
  };

  attribution?: {
    enabled: boolean;
    repo: string;
  };

  scoring: {
    title: Record<string, number>;

    description: Record<string, number>;

    location: {
      finland: string[];

      location_points: number;

      remote_keywords: string[];

      remote_points: number;
    };
  };
}

let _profile: Profile | null = null;

export async function loadProfile(): Promise<Profile> {
  if (_profile) return _profile;

  const file = Bun.file("profile.toml");

  if (!file.size) {
    console.error(
      "profile.toml not found. Copy profile.example.toml to profile.toml and fill in your details.",
    );

    process.exit(1);
  }

  _profile = parse(await file.text()) as unknown as Profile;

  return _profile;
}
