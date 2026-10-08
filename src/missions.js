/* Starter missions. Every one is fictional and unclassified. Places, units and names are invented.
   Each is a baseline with deliberate holes: edit freely. Cyber flavor only in the USCYBERCOM mission.
   `goal` is the mission's Product Goal; it fills the Product Goal row on the mission board. */
(function () {
  'use strict';
  window.MISSIONS = [
    { id: 'stealthy', service: 'Default', name: 'Map the vendor access path', op: 'Operation Stealthy Agile',
      scenario: 'A remote-access path from a vendor to Site B is not fully understood. The team must learn how it works before the next audit.',
      goal: 'Know how the vendor path reaches Site B.',
      dod: ['Evidence attached to every finding', 'Peer reviewed', 'Briefed to the Product Owner'],
      tasks: ['Confirm actor overlap with prior reporting', 'Pull badge-access logs for the site', 'Passive DNS on the vendor range', 'Correlate timing with shift change'] },
    { id: 'army', service: 'Army', name: 'Open the Redwater crossing', op: 'Operation Redwater Crossing',
      scenario: 'A brigade must open a river crossing on the fictional Redwater River so follow-on forces can move. The bridge is damaged and the far bank is lightly held.',
      goal: 'A secured crossing that carries the first vehicles within 72 hours.',
      dod: ['Route cleared and marked', 'Security positions manned', 'Traffic control in place', 'Commander confirms it is usable'],
      tasks: ['Reconnoiter crossing sites', 'Assess bridge and ford capacity', 'Request engineer support', 'Plan route clearance to the crossing', 'Position security on the far bank', 'Coordinate fires and air defense', 'Set traffic control points'] },
    { id: 'navy', service: 'Navy', name: 'Keep the Halden Strait open', op: 'Operation Halden Shield',
      scenario: 'Commercial shipping through the fictional Halden Strait is being harassed. A small task group must keep traffic moving for two weeks.',
      goal: 'Commercial traffic transits the Halden Strait safely for 14 days.',
      dod: ['Escort schedule published', 'Communications plan tested', 'Rules of engagement reviewed by the legal advisor'],
      tasks: ['Assess the threat picture', 'Build the escort schedule', 'Position surface patrols', 'Coordinate maritime patrol aircraft coverage', 'Set the communications plan with merchant ships', 'Plan replenishment at sea', 'Brief the rules of engagement'] },
    { id: 'marines', service: 'Marine Corps', name: 'Secure Port Verde for relief', op: 'Operation Port Verde Relief',
      scenario: 'After a cyclone, a small landing force must secure a damaged port so relief supplies can flow. Local authorities are cooperative but overwhelmed.',
      goal: 'Port Verde is secure and relief supplies are moving within 96 hours.',
      dod: ['Perimeter established', 'Aid distribution point running', 'Casualty evacuation route rehearsed'],
      tasks: ['Reconnoiter landing beaches', 'Plan the ship-to-shore movement', 'Secure the port perimeter', 'Coordinate with civil authorities', 'Set up the aid distribution point', 'Plan casualty evacuation', 'Establish communications ashore'] },
    { id: 'airforce', service: 'Air Force', name: 'Open the Dry Lake airstrip', op: 'Operation Dry Lake Airbridge',
      scenario: 'An austere airstrip must be opened so transport aircraft can deliver supplies. The runway is rough, fuel is limited and airspace is shared.',
      goal: 'The first transport aircraft lands and is unloaded within 48 hours.',
      dod: ['Runway survey signed off', 'Fuel and parking plan published', 'Airspace deconflicted', 'Security in place'],
      tasks: ['Survey the runway', 'Plan fuel and aircraft parking', 'Deconflict the airspace', 'Check weather and issue airfield notices', 'Set up air traffic control', 'Plan cargo handling', 'Arrange airfield security'] },
    { id: 'spaceforce', service: 'Space Force', name: 'Restore tracking coverage', op: 'Operation Orbital Watch',
      scenario: 'A sensor outage has left a gap in tracking for a set of objects in orbit. Operators must restore coverage and keep partners informed.',
      goal: 'Tracking coverage of the affected objects is restored within seven days.',
      dod: ['Coverage verified against the catalog', 'Partners notified', 'Conjunction assessments refreshed'],
      tasks: ['Assess the coverage gap', 'Reprioritize sensor tasking', 'Coordinate with partner operators', 'Refresh conjunction assessments', 'Plan ground station maintenance', 'Brief leadership on risk'] },
    { id: 'coastguard', service: 'Coast Guard', name: 'Reopen Port Calder', op: 'Operation Port Calder Reopen',
      scenario: 'A storm has closed the fictional Port Calder. Debris, damaged aids to navigation and a minor fuel sheen must be cleared before commercial traffic can resume.',
      goal: 'Port Calder reopens to commercial traffic in phases within five days.',
      dod: ['Channel surveyed and marked', 'Pollution response check complete', 'Safety zone lifted by the captain of the port'],
      tasks: ['Survey the channel for debris', 'Assess aids to navigation', 'Check for pollution and set response', 'Set the safety zone', 'Coordinate with pilots and port partners', 'Plan phased reopening by vessel size', 'Hand off any search and rescue cases'] },
    { id: 'cybercom', service: 'USCYBERCOM', name: 'Contain suspected access', op: 'Operation Nightwatch',
      scenario: 'Defenders suspect an intruder has access to a fictional logistics network ahead of an exercise. The team must confirm it, contain it and report the risk. Everything here is invented.',
      goal: 'Confirm or rule out the access and contain it within 10 days.',
      dod: ['Findings tied to evidence', 'Containment options reviewed by the commander', 'Authorities check complete', 'Partners informed'],
      tasks: ['Hunt in logs for indicators', 'Validate the asset inventory', 'Coordinate with partner cyber teams', 'Prepare containment options', 'Complete the authorities review', 'Brief the commander on risk', 'Plan restoration'] }
  ];
})();
