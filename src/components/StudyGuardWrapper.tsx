import React from "react";
import { useStudyMonitor } from "../hooks/useStudyMonitor";

interface StudyGuardWrapperProps {
  children: React.ReactNode;
}

const StudyGuardWrapper: React.FC<StudyGuardWrapperProps> = ({ children }) => {
  /**
   * Yeh hook poore project ke top level par monitor rakhega.
   * Kyunki yeh wrapper HashRouter ke bahar hai, 
   * toh route badalne par monitor restart nahi hoga.
   */
  useStudyMonitor(); 

  return <>{children}</>;
};

export default StudyGuardWrapper;
