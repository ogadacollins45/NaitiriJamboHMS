import React from "react";
import DashboardLayout from "../layout/DashboardLayout";
import PatientsContent from "../components/PatientsContent";

const Patients = () => {
  return (
    <DashboardLayout>
      <PatientsContent />
    </DashboardLayout>
  );
};

export default Patients;
