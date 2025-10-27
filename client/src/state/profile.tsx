import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";

export type CurrencyCode = "USD";

export interface Budget {
  min: number;
  max: number;
  currency: CurrencyCode;
}

export interface ProfileConstraints {
  shipping_days_max?: number | null;
  category_includes: string[];
  category_excludes: string[];
}

export interface RecipientProfile {
  age: number | null;
  gender: string | null;
  occasion: string | null;
  budget: Budget;
  relationship: string | null;
  interests: string[];
  favorite_color: string | null;
  favorite_brands: string[];
  constraints: ProfileConstraints;
}

const defaultProfile: RecipientProfile = {
  age: null,
  gender: null,
  occasion: null,
  budget: { min: 0, max: 0, currency: "USD" },
  relationship: null,
  interests: [],
  favorite_color: null,
  favorite_brands: [],
  constraints: { category_includes: [], category_excludes: [] }
};

interface ProfileContextValue {
  profile: RecipientProfile;
  setProfile: (profile: RecipientProfile) => void;
  updateProfile: (partial: Partial<RecipientProfile>) => void;
  resetProfile: () => void;
  isComplete: boolean;
  missingFields: Array<keyof RecipientProfile>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const requiredFields: Array<keyof RecipientProfile> = [
  "age",
  "gender",
  "occasion",
  "budget",
  "relationship",
  "interests",
  "favorite_color",
  "favorite_brands"
];

const getMissingFields = (profile: RecipientProfile): Array<keyof RecipientProfile> => {
  return requiredFields.filter((field) => {
    const value = profile[field];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (field === "budget") {
      return profile.budget.max <= 0 || profile.budget.min < 0;
    }
    return value === null || value === "" || value === undefined;
  });
};

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<RecipientProfile>(defaultProfile);

  const setProfile = useCallback((next: RecipientProfile) => {
    setProfileState(next);
  }, []);

  const updateProfile = useCallback((partial: Partial<RecipientProfile>) => {
    setProfileState((prev) => ({
      ...prev,
      ...partial,
      budget: partial.budget ? { ...prev.budget, ...partial.budget } : prev.budget,
      interests: partial.interests ?? prev.interests,
      favorite_brands: partial.favorite_brands ?? prev.favorite_brands,
      constraints: partial.constraints
        ? {
            category_excludes: partial.constraints.category_excludes ?? prev.constraints.category_excludes,
            category_includes: partial.constraints.category_includes ?? prev.constraints.category_includes,
            shipping_days_max:
              partial.constraints.shipping_days_max !== undefined
                ? partial.constraints.shipping_days_max
                : prev.constraints.shipping_days_max
          }
        : prev.constraints
    }));
  }, []);

  const resetProfile = useCallback(() => {
    setProfileState(defaultProfile);
  }, []);

  const missingFields = useMemo(() => getMissingFields(profile), [profile]);
  const isComplete = missingFields.length === 0;

  const value = useMemo(
    () => ({ profile, setProfile, updateProfile, resetProfile, isComplete, missingFields }),
    [profile, setProfile, updateProfile, resetProfile, isComplete, missingFields]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const value = useContext(ProfileContext);
  if (!value) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return value;
};
