import MainLayout from '../templates/MainLayout';
import PaperAssignmentTable from '../organisms/PaperAssignmentTable';

const SubEditorDashboard: React.FC = () => {
    return (
        <MainLayout>
            <main style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1rem', animation: 'fadeIn 0.5s ease-out' }}>
                <div className="glass-card" style={{
                    marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Sub-Editor Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                            Manage and assign reviewers to papers in your domain.
                        </p>
                    </div>
                </div>

                <PaperAssignmentTable userRole="sub-editor" />
            </main>
        </MainLayout>
    );
};

export default SubEditorDashboard;
