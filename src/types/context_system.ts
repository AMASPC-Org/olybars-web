export interface WeatherCondition {
  temp_f: number;
  condition_code: string;
  is_raining: boolean;
  uv_index?: number;
}

export interface WeatherCriteria {
  minTemp?: number;
  maxTemp?: number;
  requiredConditions?: string[];
  isRaining?: boolean;
}

export interface CalendarEvent {
  id: string; // Deterministic slug
  date: string; // ISO string format "YYYY-MM-DD" or "MM-DD" for recurring
  name: string;
  description?: string;
  target_tags: string[];
  weather_criteria?: WeatherCriteria;
  promotionMetadata?: {
    promotedAt: number;
    originalSource: string;
    adminNote?: string;
  };
}

export interface DiscoveredHoliday {
  id: string;
  name: string;
  date: string;
  description?: string;
  type: string;
  status: "PENDING" | "APPROVED" | "IGNORED";
  source: string;
  suggestedTags: string[];
  originalMetadata: any;
  createdAt: number;
}

export interface SystemNotification {
  id: string;
  type: "opportunity" | "alert" | "weather_warning" | "upcoming_holiday";
  title: string;
  message: string;
  action_label?: string;
  action_context?: {
    topic: string;
    intent: "MARKETING_PROMO" | "SYSTEM_ALERT" | "INFO" | "PLANNING";
    constraints?: string[];
    [key: string]: any;
  };
  priority: "high" | "medium" | "low";
  createdAt?: number;
}
