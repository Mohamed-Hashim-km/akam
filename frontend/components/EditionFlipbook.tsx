"use client";

import React from "react";
import Pdf3DFlipbook from "./Pdf3DFlipbook";

interface EditionFlipbookProps {
  pdfUrl: string;
  title?: string;
  onClose: () => void;
}

const EditionFlipbook: React.FC<EditionFlipbookProps> = ({ pdfUrl, onClose }) => {
  return <Pdf3DFlipbook pdfUrl={pdfUrl} onClose={onClose} />;
};

export default EditionFlipbook;
