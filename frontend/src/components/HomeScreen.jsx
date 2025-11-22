import CompactDashboard from './CompactDashboard';
import NotificationBanner from './NotificationBanner';
import ProposalCard from './ProposalCard';
import SavingsCard from './SavingsCard';

function HomeScreen({ stats, proposal, showProposal, onAccept, onReject, notifications, savings }) {
  return (
    <div className="screen">
      <NotificationBanner notifications={notifications} />

      <CompactDashboard stats={stats} />

      {savings && <SavingsCard savings={savings} />}

      {showProposal && proposal && (
        <ProposalCard
          proposal={proposal}
          onAccept={onAccept}
          onReject={onReject}
        />
      )}
    </div>
  );
}

export default HomeScreen;
