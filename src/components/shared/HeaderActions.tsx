import React from "react";
import Button from "./Button";

export interface HeaderActionsProps {
  onUpload: () => void;
  onCategories: () => void;
  uploadLabel: string;
  categoriesLabel: string;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
  onUpload,
  onCategories,
  uploadLabel,
  categoriesLabel,
}) => {
  return (
    <>
      <Button onClick={onUpload} variant="primary">
        {uploadLabel}
      </Button>
      <Button onClick={onCategories} variant="secondary">
        {categoriesLabel}
      </Button>
    </>
  );
};

export default HeaderActions;
