const e=`# TASK_006: Simulation Documentation Protocol

This document outlines the procedural task for generating high-standard documentation for the evolution simulator. It serves as a strict template to ensure all simulation modules (Genetics, Physics, Behavior, etc.) are documented with the same rigor, depth, and axiomatic precision as the core system.

## 1. Protocol Invocation
**Code:**
\`\`\`yaml
protocol_id: "[SYS_AXIOM_UNIFIED]"
task_id: "TASK_006_SIM_DOCS"
\`\`\`
**Explanation:**
The agent invokes the \`[SYS_AXIOM_UNIFIED]\` protocol. This signals that the documentation generation is not a creative writing exercise but a formal translation of code logic into axiomatic truth. The \`TASK_006\` identifier binds this operation to the documentation engine's registry.

## 2. Axiomatic Intent (The Mathematical Boundary)
**Code:**
\`\`\`yaml
axiomatic_intent: "∀M_module ⊢ D_doc, generate D_doc ≣ f(M_code, Π_style) where D_doc ⊆ [SYS_AXIOM_UNIFIED] ∧ Δ_ambiguity(D_doc) ≡ 0."
\`\`\`
**Explanation:**
"For every simulation module (\`∀M_module\`), extract the documentation (\`⊢ D_doc\`). Generate this documentation (\`D_doc\`) as a strict function of the module's code (\`M_code\`) and the style policy (\`Π_style\`). The resulting document must adhere to the unified protocol (\`⊆ [SYS_AXIOM_UNIFIED]\`) and contain zero ambiguity (\`Δ_ambiguity ≡ 0\`)."

## 3. Axiological Intent (The Subjective Value)
**Code:**
\`\`\`yaml
axiological_intent: "To translate the raw, computational logic of the simulation into a profound, human-readable narrative that reveals the 'why' behind the 'how', preserving the philosophical depth of the evolutionary model."
\`\`\`
**Explanation:**
The documentation must go beyond API references. It must capture the *soul* of the simulation. It explains not just that a gene mutates, but *why* that mutation matters in the context of the simulation's evolutionary philosophy.

## 4. Formal Proof (The Execution Guarantee)
**Code:**
\`\`\`yaml
formal_proof:
  premise_1: "(M_code ≣ Logic) ∧ (D_doc ≣ Explanation) ⇒ D_doc must map 1:1 to M_code"
  premise_2: "If D_doc lacks Axiomatic Context, then D_doc ≡ INCOMPLETE"
  conclusion: "D_doc ≣ VALID ⟺ (D_doc describes Logic) ∧ (D_doc reveals Intent)"
\`\`\`
**Explanation:**
*   **\`premise_1\`:** The code is the logic; the documentation is the explanation. There must be a bijective mapping between them.
*   **\`premise_2\`:** If the documentation only describes *what* the code does but fails to explain the *axiomatic context* (the underlying rules of the universe), it is incomplete.
*   **\`conclusion\`:** The documentation is valid *if and only if* it describes the logic AND reveals the intent.

## 5. Procedural Logic (The Execution Loop)
**Code:**
\`\`\`yaml
procedural_logic:
  step_1: "Analyze M_code : Extract core classes, functions, and state variables."
  step_2: "Identify I_axiom : Determine the axiomatic rule this module enforces (e.g., 'Energy Conservation')."
  step_3: "Draft D_structure : Create markdown skeleton (Overview, Axioms, Implementation, Usage)."
  step_4: "Synthesize D_content : Write content using formal, precise language. Avoid 'I think' or 'maybe'."
  step_5: "Verify (D_doc ⊆ [SYS_AXIOM_UNIFIED]) : Ensure tone matches the system's voice."
\`\`\`
**Explanation:**
1.  **Analyze:** Read the code. Understand the data structures.
2.  **Identify Axiom:** What universal law does this code represent?
3.  **Draft:** Build the standard markdown structure.
4.  **Synthesize:** Write with authority. The simulation is a deterministic system; the documentation should reflect that.
5.  **Verify:** Check against the style guide.

## 6. Documentation Template
**Standard Structure for Simulation Modules:**

\`\`\`markdown
# [Module Name] (e.g., 03_Genetics)

## 1. Axiomatic Definition
*Define the core truth this module represents.*
> "Genetics is the mechanism by which information is encoded, mutated, and transmitted across generations, subject to the constraints of entropy."

## 2. Core Components
*List the primary classes/functions.*
*   **\`Genome\`**: The data structure holding the bit-string.
*   **\`Mutator\`**: The operator that introduces random bit-flips.
*   **\`Crossover\`**: The operator that recombines two Genomes.

## 3. Operational Logic
*Explain the flow of data.*
1.  **Initialization**: How is the first generation created?
2.  **Process**: How does the module execute per tick?
3.  **Output**: What data does it return to the main loop?

## 4. Mathematical Model
*Show the math.*
$$ P(mutation) = 1 - (1 - \\mu)^L $$
Where $\\mu$ is the mutation rate and $L$ is the genome length.

## 5. Integration
*How does this fit into the whole?*
This module receives \`Entity\` objects from the \`PopulationManager\` and returns modified \`Genome\` objects to the \`ReproductionSystem\`.
\`\`\`

## 7. Look Ahead (The Terminal State)
**Code:**
\`\`\`yaml
look_ahead: "D_doc serves as the immutable chronicle of the simulation's internal reality, allowing observers to comprehend the deterministic beauty of the evolutionary process."
\`\`\`
**Explanation:**
The documentation is the "chronicle." It allows users to understand the simulation not just as code, but as a coherent, unfolding reality.
`;export{e as default};
