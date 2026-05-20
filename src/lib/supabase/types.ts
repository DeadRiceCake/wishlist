export type WishStatus = "WANT" | "PLANNED" | "DONE" | "ARCHIVED";
export type WishVisibility = "PRIVATE" | "COUPLE";

export type Wish = {
  id: string;
  title: string;
  memo: string;
  status: WishStatus;
  priority: 1 | 2 | 3;
  visibility: WishVisibility;
  updated_at: string;
};
