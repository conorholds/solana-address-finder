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
                <input type="text" class="seed" placeholder="(text, public key, or number)">
            </div>
            <div class="seed-type">
                <select class="seed-type-select">
                    <option value="text">Text</option>
                    <option value="textToNumbers">32-Byte String</option>
                    <option value="pubkey">Public Key</option>
                    <option value="uint8">uint8 (1 byte)</option>
                    <option value="uint16">uint16 (2 bytes)</option>
                    <option value="uint32">uint32 (4 bytes)</option>
                    <option value="uint64">uint64 (8 bytes)</option>
                </select>
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

// Convert number to bytes based on selected type
function numberToBytes(value, type) {
  let buffer;
  let view;
  const num = parseInt(value, 10);

  switch (type) {
    case "uint8":
      buffer = new ArrayBuffer(1);
      view = new DataView(buffer);
      view.setUint8(0, num);
      break;
    case "uint16":
      buffer = new ArrayBuffer(2);
      view = new DataView(buffer);
      view.setUint16(0, num, true); // true for little-endian
      break;
    case "uint32":
      buffer = new ArrayBuffer(4);
      view = new DataView(buffer);
      view.setUint32(0, num, true);
      break;
    case "uint64":
      buffer = new ArrayBuffer(8);
      view = new DataView(buffer);
      const bigInt = BigInt(num);
      // Writing a BigInt to the view
      for (let i = 0; i < 8; i++) {
        view.setUint8(i, Number((bigInt >> BigInt(i * 8)) & BigInt(0xff)));
      }
      break;
    default:
      throw new Error(`Unsupported number type: ${type}`);
  }

  return new Uint8Array(buffer);
}

// Convert string to array of ASCII values (for text to numbers option)
function stringToAsciiArray(str) {
  const asciiArray = [];
  for (let i = 0; i < str.length; i++) {
    asciiArray.push(str.charCodeAt(i));
  }
  return asciiArray;
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
    const seedRows = document.querySelectorAll(".seed-row");
    const seeds = [];

    console.log("Processing seeds...");

    for (const row of seedRows) {
      const seedInput = row.querySelector(".seed");
      const seedTypeSelect = row.querySelector(".seed-type-select");

      const seedValue = seedInput.value.trim();
      const seedType = seedTypeSelect.value;

      if (seedValue) {
        console.log(`Processing seed "${seedValue}" of type "${seedType}"`);

        let seedBuffer;

        switch (seedType) {
          case "text":
            seedBuffer = new TextEncoder().encode(seedValue);
            console.log("Text seed:", seedValue, "as bytes:", seedBuffer);
            break;

          case "textToNumbers":
            try {
              // Create a fixed-size 32-byte array initialized with zeros
              const bytes = new Uint8Array(32);

              // Fill in the characters of the string at the beginning
              for (let i = 0; i < Math.min(seedValue.length, 32); i++) {
                bytes[i] = seedValue.charCodeAt(i);
              }

              // The rest of the array is already zeros by default

              seedBuffer = bytes;
              console.log(
                "32-Byte String seed:",
                seedValue,
                "as 32-byte array:",
                seedBuffer
              );
            } catch (e) {
              showPDAError(`Error processing 32-Byte String: ${e.message}`);
              return;
            }
            break;

          case "pubkey":
            try {
              const pubkey = new solanaWeb3.PublicKey(seedValue);
              seedBuffer = pubkey.toBuffer();
              console.log("PublicKey seed:", seedValue);
            } catch (e) {
              showPDAError(`Invalid public key: ${seedValue}`);
              return;
            }
            break;

          case "uint8":
          case "uint16":
          case "uint32":
          case "uint64":
            if (!/^\d+$/.test(seedValue)) {
              showPDAError(`Invalid number for ${seedType}: ${seedValue}`);
              return;
            }
            try {
              seedBuffer = numberToBytes(seedValue, seedType);
              console.log(
                `${seedType} seed:`,
                seedValue,
                "as bytes:",
                seedBuffer
              );
            } catch (e) {
              showPDAError(`Error converting number: ${e.message}`);
              return;
            }
            break;

          default:
            showPDAError(`Unknown seed type: ${seedType}`);
            return;
        }

        seeds.push(seedBuffer);
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
