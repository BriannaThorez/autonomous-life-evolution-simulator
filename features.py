# Features of Autonomous Life Evolution Simulator

program_features = {
    "Genetic System": {
        "description": "Dominance-based genetic inheritance system with mutation rates.",
        "status": "Verified",
        "details": "Located in Genetics.ts. Handles crossover and mutation of traits."
    },
    "Metabolic System": {
        "description": "Quadratic metabolic taxes based on size and speed.",
        "status": "Verified",
        "details": "Located in Metabolism.ts. Calculates energy consumption."
    },
    "Simulation Engine": {
        "description": "Core loop for life evolution simulation.",
        "status": "Verified",
        "details": "Located in SimulationEngine.ts. Manages Faunas and environment."
    },
    "Vector Database": {
        "description": "Efficient storage and retrieval of Fauna states using vector-based analytical sensing.",
        "status": "Verified",
        "details": "Located in VectorDB.ts."
    },
    "Vector DB Visualizer": {
        "description": "Interactive UI component to visualize Vector DB contents with cute profile cards.",
        "status": "In Progress",
        "details": "Located in VectorDBVisualizer.tsx. Being updated to use card-based display."
    },
    "Entity Inspector": {
        "description": "UI component to view and edit Fauna properties.",
        "status": "Verified",
        "details": "Located in EntityInspector.tsx."
    },
    "Responsive UI": {
        "description": "Aesthetically pleasing UI that auto-adjusts between desktop and mobile with panning and zooming.",
        "status": "In Progress",
        "details": "React-based UI with glassmorphic elements and interactive map."
    },
    "Snapshots": {
        "description": "Automated program state snapshots for development tracking.",
        "status": "Implemented",
        "details": "Copies codebase to /snapshots folder."
    },
    "Persistence System": {
        "description": "Full session persistence state saving in Vector DB.",
        "status": "In Progress",
        "details": "Implementation of localStorage-based state saving for all entities and world state."
    },
    "Settings & Management": {
        "description": "System control menu with master reset functionalities.",
        "status": "In Progress",
        "details": "Includes confirmation-protected simulation resets."
    },
    "Help & Documentation": {
        "description": "In-program guidance and mechanic explanations via tooltips.",
        "status": "In Progress",
        "details": "Hover-based tooltips for complex genetics and generation mechanics."
    }
}

if __name__ == "__main__":
    import json
    print(json.dumps(program_features, indent=4))
