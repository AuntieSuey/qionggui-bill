export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isActive: boolean;
}

export interface CategoryForm {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}
