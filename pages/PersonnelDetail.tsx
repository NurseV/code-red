import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import * as api from '../services/api';
import { UserIcon, PlusIcon, GraduationCapIcon, XIcon, EditIcon, UploadIcon, FileTextIcon, BuildingIcon, MailIcon, ShieldIcon } from '../components/icons/Icons';
import { Personnel, Role } from '../types';
import { useInternalAuth } from '../hooks/useInternalAuth';
import Accordion from '../components/ui/Accordion';

const DetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-dark-text-secondary">{label}</dt>
        <dd className="mt-1 text-sm text-dark-text">{value || 'N/A'}</dd>
    </div>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm disabled:opacity-70"
    />
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm disabled:opacity-70"
    />
)

const calculateAge = (dob: string | undefined): number | string => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const calculateLengthOfService = (hireDate: string | undefined): string => {
    if (!hireDate) return 'N/A';
    const start = new Date(hireDate);
    const end = new Date();
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    if (months < 0) {
        years--;
        months += 12;
    }
    return `${years} years, ${months} months`;
}


const EditableSectionCard: React.FC<{
    title: string;
    children: (isEditing: boolean, data: any, setData: React.Dispatch<React.SetStateAction<any>>) => React.ReactNode;
    onSave: (data: any) => Promise<void>;
    initialData: any;
    canEdit: boolean;
}> = ({ title, children, onSave, initialData, canEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleSave = async () => {
    await onSave(data);
    setIsEditing(false);
  }

  const handleCancel = () => {
    setData(initialData);
    setIsEditing(false);
  }

  return (
    <Card
      title={title}
      actions={
        canEdit ? (
          isEditing ? (
            <>
              <Button onClick={handleCancel} variant="ghost" className="text-xs">Cancel</Button>
              <Button onClick={handleSave} className="text-xs">Save</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="ghost" icon={<EditIcon className="h-4 w-4"/>} />
          )
        ) : null
      }
    >
      {children(isEditing, data, setData)}
    </Card>
  )
}


const PersonnelDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useInternalAuth();
    const [personnel, setPersonnel] = useState<Personnel | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const canEdit = user?.role === Role.ADMINISTRATOR || user?.role === Role.CHIEF;
    const canViewSensitive = user?.role === Role.ADMINISTRATOR || user?.role === Role.CHIEF;


    const fetchPersonnel = useCallback(() => {
        if (id) {
            setIsLoading(true);
            api.getPersonnelById(id)
                .then(setPersonnel)
                .finally(() => setIsLoading(false));
        }
    }, [id]);

    useEffect(() => {
        fetchPersonnel();
    }, [fetchPersonnel]);

    const handleUpdate = async (updatedData: Partial<Personnel>) => {
        if (!id || !user) return;
        await api.updatePersonnel(id, updatedData, user);
        fetchPersonnel(); // Re-fetch to get latest data
    };
    
    const handleUploadFile = async (certId: string, file: File) => {
        if (!id) return;
        try {
            await api.uploadCertificationDocument(id, certId, file);
            fetchPersonnel();
            alert("Document uploaded.");
        } catch(e) {
            alert("Failed to upload document.");
        }
    }

    if (isLoading) {
        return <div className="text-center text-dark-text-secondary">Loading personnel details...</div>;
    }

    if (!personnel) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-dark-text">Personnel Not Found</h2>
                <Link to="/app/personnel" className="mt-4 inline-block"><Button>Back to Roster</Button></Link>
            </div>
        );
    }
    
    const statusColor = personnel.status === 'Active' ? 'bg-green-500' : personnel.status === 'Probation' ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row items-start md:items-center">
                    <img className={`h-24 w-24 rounded-full object-cover border-4 ${statusColor.replace('bg-','border-')}`} src={personnel.avatarUrl} alt="User avatar" />
                    <div className="flex-1 md:ml-6 mt-4 md:mt-0">
                        <h2 className="text-2xl font-bold text-dark-text">{personnel.name}</h2>
                        <p className="text-lg text-dark-text-secondary">{personnel.rank}</p>
                         <span className={`mt-2 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${ statusColor.replace('bg-', 'bg-').replace('-500', '-100') } ${ statusColor.replace('bg-', 'text-').replace('-500', '-800') }`}>
                          {personnel.status}
                        </span>
                    </div>
                     <div className="flex flex-wrap gap-2 mt-2">
                        {personnel.positions?.map(pos => (
                             <span key={pos} className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full">{pos}</span>
                        ))}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <EditableSectionCard title="Member Info" initialData={personnel} onSave={handleUpdate} canEdit={canEdit}>
                        {(isEditing, data, setData) => (
                             <dl className="space-y-4">
                                <DetailItem label="NFIRS ID" value={data.nfirsId} />
                                <DetailItem label="Badge Number" value={data.badgeNumber} />
                                <DetailItem label="Active 911 Code" value={data.active911Code} />
                                <DetailItem label="Length of Service" value={calculateLengthOfService(data.hireDate)} />
                                <div>
                                    <label className="text-sm font-medium text-dark-text-secondary">Assignment</label>
                                    {isEditing ? <Input name="assignment" value={data.assignment || ''} onChange={e => setData({...data, assignment: e.target.value})} /> : <dd className="mt-1 text-sm text-dark-text">{data.assignment || 'N/A'}</dd>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-dark-text-secondary">Rank</label>
                                    {isEditing ? <Input name="rank" value={data.rank || ''} onChange={e => setData({...data, rank: e.target.value})} /> : <dd className="mt-1 text-sm text-dark-text">{data.rank}</dd>}
                                </div>
                                 <div>
                                    <label className="text-sm font-medium text-dark-text-secondary">Status</label>
                                    {isEditing ? <select name="status" value={data.status} onChange={e => setData({...data, status: e.target.value})} className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"><option>Active</option><option>Probation</option><option>Inactive</option></select> : <dd className="mt-1 text-sm text-dark-text">{data.status}</dd>}
                                </div>
                             </dl>
                        )}
                    </EditableSectionCard>
                    
                     <EditableSectionCard title="HR Information" initialData={personnel} onSave={handleUpdate} canEdit={canViewSensitive}>
                        {(isEditing, data, setData) => (
                             <dl className="space-y-4">
                                <DetailItem label="Age" value={calculateAge(data.dateOfBirth)} />
                                <div>
                                    <label className="text-sm font-medium text-dark-text-secondary">Date of Birth</label>
                                    {isEditing ? <Input type="date" value={data.dateOfBirth?.split('T')[0] || ''} onChange={e => setData({...data, dateOfBirth: e.target.value})} /> : <dd className="mt-1 text-sm text-dark-text">{data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : 'N/A'}</dd>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-dark-text-secondary">Gender</label>
                                    {isEditing ? <Input value={data.gender || ''} onChange={e => setData({...data, gender: e.target.value})} /> : <dd className="mt-1 text-sm text-dark-text">{data.gender || 'N/A'}</dd>}
                                </div>
                                 <div>
                                    <label className="text-sm font-medium text-dark-text-secondary">Spouse Name</label>
                                    {isEditing ? <Input value={data.spouse?.name || ''} onChange={e => setData({...data, spouse: {...data.spouse, name: e.target.value}})} /> : <dd className="mt-1 text-sm text-dark-text">{data.spouse?.name || 'N/A'}</dd>}
                                </div>
                                <DetailItem label="Social Security Number" value={canViewSensitive ? data.ssn : '***-**-****'} />
                             </dl>
                        )}
                    </EditableSectionCard>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Qualifications">
                        <Accordion title={`Certifications (${personnel.certifications.length})`}>
                            {personnel.certifications.length > 0 ? (
                                <ul className="divide-y divide-dark-border">
                                    {personnel.certifications.map(cert => (
                                        <li key={cert.id} className="py-3 flex justify-between items-center group">
                                            <div>
                                                <span className="font-medium text-dark-text">{cert.name}</span>
                                                <span className="text-sm text-dark-text-secondary ml-4">Expires: {new Date(cert.expires).toLocaleDateString()}</span>
                                            </div>
                                            {cert.documentUrl ? <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer"><FileTextIcon className="h-5 w-5 text-blue-400"/></a> : (canEdit && <label className="opacity-0 group-hover:opacity-100 transition-opacity"><UploadIcon className="h-5 w-5 text-gray-400 cursor-pointer"/><input type="file" className="hidden" onChange={e => e.target.files && handleUploadFile(cert.id, e.target.files[0])} /></label>)}
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-dark-text-secondary text-center py-4">No certifications.</p>}
                        </Accordion>
                         <Accordion title={`Training History (${personnel.trainingHistory.length})`}>
                            {personnel.trainingHistory.length > 0 ? (
                                <ul className="divide-y divide-dark-border">
                                    {personnel.trainingHistory.map(record => (
                                        <li key={record.courseId} className="py-3 flex justify-between items-center group">
                                            <div>
                                                <span className="font-medium text-dark-text">{record.courseName}</span>
                                                <span className="text-sm text-dark-text-secondary ml-4">Completed: {new Date(record.completedDate).toLocaleDateString()}</span>
                                            </div>
                                            {record.documentUrl ? <a href={record.documentUrl} target="_blank" rel="noopener noreferrer"><FileTextIcon className="h-5 w-5 text-blue-400"/></a> : (canEdit && <label className="opacity-0 group-hover:opacity-100 transition-opacity"><UploadIcon className="h-5 w-5 text-gray-400 cursor-pointer"/><input type="file" className="hidden" /></label>)}
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-dark-text-secondary text-center py-4">No training history.</p>}
                        </Accordion>
                        <Accordion title={`Awards (${personnel.awards?.length || 0})`}>
                             {personnel.awards && personnel.awards.length > 0 ? (
                                <ul className="divide-y divide-dark-border">
                                    {personnel.awards.map(award => (
                                        <li key={award.id} className="py-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-dark-text">{award.name}</p>
                                                    <p className="text-sm text-dark-text-secondary mt-1">{award.description}</p>
                                                </div>
                                                <p className="text-sm text-dark-text-secondary flex-shrink-0 ml-4">{new Date(award.dateReceived).toLocaleDateString()}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-dark-text-secondary text-center py-4">No awards on record.</p>}
                        </Accordion>
                    </Card>
                     <Card title="Notes">
                         <EditableSectionCard title="" initialData={personnel} onSave={handleUpdate} canEdit={canEdit}>
                             {(isEditing, data, setData) => (
                                <Textarea value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} disabled={!isEditing} rows={5} />
                             )}
                         </EditableSectionCard>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PersonnelDetail;
