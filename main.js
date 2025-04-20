// Initialize seed container with one seed
document.addEventListener("DOMContentLoaded", function () {
  addSeed();
});

// Switch between tabs
function switchTab(tabId) {
  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Deactivate all tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Activate selected tab
  document.getElementById(tabId).classList.add("active");

  // Find and activate the tab button
  const tabIndex = tabId === "ata-tab" ? 0 : 1;
  document.querySelectorAll(".tab")[tabIndex].classList.add("active");

  // Hide errors
  document.querySelectorAll(".error").forEach((error) => {
    error.style.display = "none";
  });

  // Hide results
  document.querySelectorAll(".result").forEach((result) => {
    result.style.display = "none";
  });
}

// Modal functions
function openATAModal() {
  document.getElementById("ata-modal").style.display = "block";
}

function openPDAModal() {
  document.getElementById("pda-modal").style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Close modal when clicking outside of it
window.onclick = function (event) {
  if (event.target.className === "modal") {
    event.target.style.display = "none";
  }
};

// Add a new seed input field
function addSeed() {
  const seedContainer = document.getElementById("seedContainer");
  const seedRow = document.createElement("div");
  seedRow.className = "seed-row";
  seedRow.innerHTML = `
            <div class="seed-input">
                <input type="text" class="seed" placeholder="Enter seed (text or public key)">
            </div>
            <button class="btn-small" onclick="removeSeed(this)">✕</button>
        `;
  seedContainer.appendChild(seedRow);
}

// Remove a seed input field
function removeSeed(button) {
  const seedContainer = document.getElementById("seedContainer");
  if (seedContainer.children.length > 1) {
    button.parentElement.remove();
  }
}

// Derive an Associated Token Account
async function deriveATA() {
  try {
    // Hide previous result and error
    document.getElementById("ata-result").style.display = "none";
    document.getElementById("ata-error").style.display = "none";

    const walletAddressStr = document
      .getElementById("walletAddress")
      .value.trim();
    const mintAddressStr = document.getElementById("mintAddress").value.trim();

    if (!walletAddressStr || !mintAddressStr) {
      showATAError("Please enter both wallet address and mint address");
      return;
    }

    // Validate addresses
    try {
      // Create PublicKey objects from the input strings
      const walletAddress = new solanaWeb3.PublicKey(walletAddressStr);
      const mintAddress = new solanaWeb3.PublicKey(mintAddressStr);
      const tokenProgramId = new solanaWeb3.PublicKey(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
      );
      const associatedTokenProgramId = new solanaWeb3.PublicKey(
        "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
      );

      // Find associated token address
      const [ataAddress] = await solanaWeb3.PublicKey.findProgramAddress(
        [
          walletAddress.toBuffer(),
          tokenProgramId.toBuffer(),
          mintAddress.toBuffer(),
        ],
        associatedTokenProgramId
      );

      // Display result
      document.getElementById("ata-result-address").textContent =
        ataAddress.toString();
      document.getElementById("ata-result").style.display = "block";
    } catch (e) {
      showATAError(`Invalid address: ${e.message}`);
    }
  } catch (error) {
    console.error("Error deriving ATA:", error);
    showATAError(`Error: ${error.message}`);
  }
}

// Derive a Program Derived Address
async function derivePDA() {
  try {
    // Hide previous result and error
    document.getElementById("pda-result").style.display = "none";
    document.getElementById("pda-error").style.display = "none";

    const programIdStr = document.getElementById("programId").value.trim();

    if (!programIdStr) {
      showPDAError("Please enter a program ID");
      return;
    }

    // Get seeds
    const seedInputs = document.querySelectorAll(".seed");
    const seeds = [];

    for (const seedInput of seedInputs) {
      const seedValue = seedInput.value.trim();
      if (seedValue) {
        // Check if it's a number
        if (/^\d+$/.test(seedValue)) {
          // It's a number, convert to little-endian bytes
          const num = BigInt(seedValue);
          const buffer = new Uint8Array(8); // 8 bytes for uint64
          for (let i = 0; i < 8; i++) {
            buffer[i] = Number((num >> BigInt(i * 8)) & BigInt(0xff));
          }
          seeds.push(buffer);
          console.log("Number seed:", seedValue, "as bytes:", buffer);
        }
        // Check if it's likely a public key
        else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(seedValue)) {
          try {
            // Try as a public key
            const pubkey = new solanaWeb3.PublicKey(seedValue);
            seeds.push(pubkey.toBuffer());
            console.log("PublicKey seed:", seedValue);
          } catch (e) {
            // Not a valid public key, use as text
            const textBuffer = new TextEncoder().encode(seedValue);
            seeds.push(textBuffer);
            console.log("Text seed (looks like pubkey):", seedValue);
          }
        } else {
          // Regular text
          const textBuffer = new TextEncoder().encode(seedValue);
          seeds.push(textBuffer);
          console.log("Text seed:", seedValue);
        }
      }
    }

    if (seeds.length === 0) {
      showPDAError("Please add at least one seed");
      return;
    }

    // Debug log seeds
    seeds.forEach((seed, i) => {
      console.log(`Seed ${i}:`, seed);
    });

    // Validate program ID
    try {
      const programId = new solanaWeb3.PublicKey(programIdStr);

      // Find program address
      const [pdaAddress, bump] = await solanaWeb3.PublicKey.findProgramAddress(
        seeds,
        programId
      );

      // Display result
      document.getElementById("pda-result-address").textContent =
        pdaAddress.toString();
      document.getElementById("pda-bump").textContent = bump;
      document.getElementById("pda-result").style.display = "block";

      console.log("PDA:", pdaAddress.toString(), "with bump:", bump);
    } catch (e) {
      showPDAError(`Error deriving PDA: ${e.message}`);
      console.error("PDA derivation error:", e);
    }
  } catch (error) {
    console.error("Error deriving PDA:", error);
    showPDAError(`Error: ${error.message}`);
  }
}

// Show ATA error message
function showATAError(message) {
  const errorElement = document.getElementById("ata-error");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// Show PDA error message
function showPDAError(message) {
  const errorElement = document.getElementById("pda-error");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}
