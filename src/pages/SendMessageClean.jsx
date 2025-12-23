import React, { useState, useEffect, useMemo } from "react";
import {
  FiCheck,
  FiUpload,
  FiX,
  FiEye,
  FiSend,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import ModernTemplatePreview from "../components/ModernTemplatePreview";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Virtual scrolling component for large lists
const VirtualizedContactList = ({ contacts, updateContact, deleteContact }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = 50;
  const containerHeight = 384; // max-h-96 = 384px
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 5, contacts.length);
  const visibleItems = contacts.slice(startIndex, endIndex);
  const totalHeight = contacts.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div 
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={(e) => setScrollTop(e.target.scrollTop)}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                    SN
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                    Phone Number
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((contact, idx) => {
                  const actualIndex = startIndex + idx;
                  return (
                    <tr key={contact.id} className="hover:bg-gray-50" style={{ height: itemHeight }}>
                      <td className="px-4 py-2 text-sm border-b">
                        {actualIndex + 1}
                      </td>
                      <td className="px-4 py-2 border-b">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={contact.number}
                            onChange={(e) => updateContact(contact.id, e.target.value)}
                            placeholder="+91xxxxxxxxxx"
                            className={`w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 ${
                              contact.capable === true
                                ? "border-green-500 bg-green-50"
                                : contact.capable === false
                                ? "border-red-500 bg-red-50"
                                : ""
                            }`}
                          />
                          {contact.checking && (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                          {contact.capable === true && (
                            <span className="text-green-600 text-sm">✓</span>
                          )}
                          {contact.capable === false && (
                            <span className="text-red-600 text-sm">✗</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 border-b">
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const MESSAGE_TYPES = {
  text: "Plain Text",
  "text-with-action": "Text with Actions",
  rcs: "RCS Rich Card",
  carousel: "Carousel",
  webview: "Webview Action",
  "dialer-action": "Dialer Action",
};

const BUTTON_TYPES = ["URL Button", "Call Button", "Quick Reply Button"];

export default function SendMessageClean() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [messageType, setMessageType] = useState("text");
  const [template, setTemplate] = useState("new");
  /*  */ const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState([]);
  const [excludeUnsub, setExcludeUnsub] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // RCS Rich Card
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [footer, setFooter] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [buttons, setButtons] = useState([]);

  // Carousel
  const [carouselCards, setCarouselCards] = useState([]);

  // Variables
  const [variables, setVariables] = useState({});

  // Response Modal
  const [checkingCapability, setCheckingCapability] = useState(false);
  const [sending, setSending] = useState(false);
  const [resultData, setResultData] = useState(null);

  const showResult = (res) => {
    setResultData(res);
    if (res?.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [showManualImport, setShowManualImport] = useState(false);
  const [manualNumbers, setManualNumbers] = useState("");
  const [parsedNumbers, setParsedNumbers] = useState([]);
  const [showCountryCode, setShowCountryCode] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");

  useEffect(() => {
    if (user?._id) {
      loadTemplates();
    }
  }, [user, refreshing]);

  const loadTemplates = async () => {
    try {
      const response = await api.getUserTemplates(user?._id);

      setTemplates(response.data || []);
    } catch (error) {
      toast.error("Error loading templates: " + error.message);
    }
  };

  const handleTemplateSelect = async (templateId) => {
    if (templateId === "new") {
      setTemplate("new");
      setSelectedTemplate(null);
      setMessage("");
      setMessageType("text");
      setButtons([]);
      setCarouselCards([]);
      setMediaUrl("");
      setFooter("");
      setCardDescription("");
      return;
    }

    try {
      const response = await api.getTemplateById(templateId);
      const templateData = response.data;
      setSelectedTemplate(templateData);
      setTemplate(templateId);
      setMessageType(templateData.messageType);

      // Reset all fields
      setMessage("");
      setMediaUrl("");
      setFooter("");
      setCardDescription("");
      setButtons([]);
      setCarouselCards([]);

      // Set message based on type
      if (templateData.text) setMessage(templateData.text);
      if (templateData.richCard?.title)
        setMessage(templateData?.richCard?.title);
      if (templateData.richCard?.subtitle)
        setCardDescription(templateData?.richCard?.subtitle);
      if (templateData.richCard?.description) {
        setCardDescription(templateData?.richCard?.description);
      } else if (templateData.richCard?.subtitle) {
        setCardDescription(templateData?.richCard?.subtitle);
      }
      if (templateData.richCard?.imageUrl)
        setMediaUrl(templateData?.richCard?.imageUrl);
      if (templateData.imageUrl) setMediaUrl(templateData?.imageUrl);

      // Set buttons for RCS (from richCard.actions)
      if (
        templateData.richCard?.actions &&
        templateData.richCard.actions.length > 0
      ) {
        setButtons(
          templateData.richCard.actions.map((action, idx) => ({
            id: Date.now() + idx,
            type:
              action.type === "url"
                ? "URL Button"
                : action.type === "call"
                ? "Call Button"
                : "Quick Reply Button",
            title: action.title,
            value: action.payload || "",
          }))
        );
      }
      // Set buttons for text-with-action (from actions)
      else if (templateData.actions && templateData.actions.length > 0) {
        setButtons(
          templateData.actions.map((action, idx) => ({
            id: Date.now() + idx,
            type:
              action.type === "url"
                ? "URL Button"
                : action.type === "call"
                ? "Call Button"
                : "Quick Reply Button",
            title: action.title,
            value: action.payload || "",
          }))
        );
      }

      // Set carousel cards
      if (templateData.carouselItems && templateData.carouselItems.length > 0) {
        setCarouselCards(
          templateData.carouselItems.map((item, idx) => ({
            id: Date.now() + idx,
            title: item.title,
            description: item.subtitle || item.description || "",
            imageUrl: item.imageUrl || "",
            image: null,
            buttons:
              item.actions?.map((action, btnIdx) => ({
                id: Date.now() + idx + btnIdx,
                type:
                  action.type === "url"
                    ? "URL Button"
                    : action.type === "call"
                    ? "Call Button"
                    : "Quick Reply Button",
                title: action.title,
                value: action.payload || action.url || action.phoneNumber || "",
              })) || [],
          }))
        );
      }
    } catch (error) {
      toast.error("Failed to load template: " + error.message);
    }
  };

  const uploadFile = async (file) => {
    try {
      const result = await api.uploadFile(file);
      toast.success("File uploaded successfully");
      return result.url;
    } catch (error) {
      toast.error("File upload failed: " + error.message);
      return null;
    }
  };

  const parseManualNumbers = (text) => {
    const lines = text.split("\n").filter((line) => line.trim());
    const parsed = [];
    const seen = new Set();

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let name = "";
      let num = trimmed;

      // Check if comma separated (name,number)
      if (trimmed.includes(",")) {
        const parts = trimmed.split(",");
        name = parts[0].trim();
        num = parts[1] ? parts[1].trim() : "";
      }

      if (!num) return;

      // Clean number - remove spaces, dashes, brackets, dots
      num = num.replace(/[\s\-\(\)\.]/g, "");

      // Extract only digits and +
      num = num.replace(/[^\d+]/g, "");

      // Handle different formats
      if (num.startsWith("+91")) {
        num = num.substring(3);
      } else if (num.startsWith("+")) {
        num = num.substring(1);
        if (num.startsWith("91")) num = num.substring(2);
      } else if (num.startsWith("91") && num.length > 10) {
        num = num.substring(2);
      } else if (num.startsWith("0")) {
        num = num.substring(1);
      }

      // Validate 10 digit number
      if (/^\d{10}$/.test(num)) {
        const fullNum = "+91" + num;
        if (!seen.has(fullNum)) {
          seen.add(fullNum);
          parsed.push({
            id: Date.now() + idx + Math.random(),
            name: name || "",
            number: fullNum,
          });
        }
      }
    });

    setParsedNumbers(parsed);
  };

  const applyCountryCode = () => {
    if (!selectedCountryCode) return;

    const updatedContacts = contacts.map((contact) => {
      let num = contact.number;
      // Remove existing country code if present
      if (num.startsWith("+")) {
        // Find where country code ends (after +, take 1-4 digits)
        const match = num.match(/^\+(\d{1,4})(\d+)$/);
        if (match) {
          num = match[2]; // Keep only the phone number part
        }
      }
      // Remove any leading zeros or spaces
      num = num.replace(/^[\s0]+/, "");
      // Add new country code
      return { ...contact, number: selectedCountryCode + num };
    });
    setContacts(updatedContacts);
    setShowCountryCode(false);
    setCountrySearch("");
  };

  const checkRcsCapability = async (numbers) => {
    try {
      const response = await api.chackcapebalNumber(numbers, user._id);
      return response;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };

  const importManualNumbers = async () => {
    if (parsedNumbers.length === 0) return;

    // Validation: Only 1 number OR 500+ numbers allowed
    //   if (parsedNumbers.length > 1 && parsedNumbers.length < 500) {
    //     showResult({
    //       success: false,
    //       message: `Invalid count! You can add only 1 number or minimum 500 numbers. Current: ${parsedNumbers.length}`
    //     })
    // }

    setCheckingCapability(true);
    const allNumbers = parsedNumbers.map((item) => item.number);

    try {
      let capableNumbers = [];

      const response = await api.chackcapebalNumber(allNumbers, user._id);
      const rcsMessaging =
        response?.data?.rcsMessaging || response?.rcsMessaging;

      if (rcsMessaging) {
        if (rcsMessaging.reachableUsers) {
          capableNumbers = parsedNumbers
            .filter((item) => rcsMessaging.reachableUsers.includes(item.number))
            .map((item) => ({
              id: Date.now() + Math.random(),
              number: item.number,
              vars: {},
              capable: true,
            }));
        } else {
          allNumbers.forEach((num) => {
            const userData = rcsMessaging[num];
            if (userData?.features && userData.features.length > 0) {
              const item = parsedNumbers.find((p) => p.number === num);
              if (item) {
                capableNumbers.push({
                  id: Date.now() + Math.random(),
                  number: item.number,
                  vars: {},
                  capable: true,
                });
              }
            }
          });
        }
      }

      setContacts(prev => [...prev, ...capableNumbers]);
      setCheckingCapability(false);
      setShowManualImport(false);
      setManualNumbers("");
      setParsedNumbers([]);

      showResult({
        success: true,
        message: `${capableNumbers.length} capable numbers added out of ${allNumbers.length}`,
      });
    } catch (error) {
      setCheckingCapability(false);
      // toast.error('Error checking capability: ' + error.message)
    }
  };

  const updateContact = async (id, value) => {
    // Ensure +91 prefix
    if (!value.startsWith("+91") && value.length > 0) {
      value = "+91" + value.replace(/^\+?91?/, "");
    }

    // If user types 10 digits, auto-add +91
    if (/^\d{10}$/.test(value)) {
      value = "+91" + value;
    }

    // Use functional update to avoid stale closure
    setContacts(prev => 
      prev.map(c => 
        c.id === id ? { ...c, number: value, checking: true } : c
      )
    );

    // Check RCS capability if number is complete (10 digits after +91)
    if (value.length >= 13 && value.startsWith("+91")) {
      try {
        setCheckingCapability(true);
        const response = await checkRcsCapability([value]);

        const rcsMessaging = response?.data?.rcsMessaging || response?.rcsMessaging;
        const rcsData = rcsMessaging?.[value];
        const isCapable = rcsData?.features && rcsData.features.length > 0;
        
        setContacts(prev =>
          prev.map(c =>
            c.id === id
              ? { ...c, number: value, checking: false, capable: isCapable }
              : c
          )
        );

        // Remove if not capable
        if (!isCapable) {
          setTimeout(() => {
            setContacts(prev => prev.filter(c => c.id !== id));
          }, 1000);
        }
      } catch (error) {
        setContacts(prev =>
          prev.map(c =>
            c.id === id ? { ...c, checking: false, capable: false } : c
          )
        );
      } finally {
        setCheckingCapability(false);
      }
    } else {
      setContacts(prev =>
        prev.map(c =>
          c.id === id ? { ...c, checking: false, capable: null } : c
        )
      );
    }
  };

  const deleteContact = (id) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  const importExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, {
          type: "array",
          cellText: false,
          cellDates: false,
        });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          raw: true,
          defval: "",
        });

        const imported = [];
        const seen = new Set();
        let skippedFirst = false;

        // Process in chunks to avoid blocking UI
        const processChunk = (startIdx, chunkSize = 1000) => {
          return new Promise(resolve => {
            setTimeout(() => {
              const endIdx = Math.min(startIdx + chunkSize, data.length);
              
              for (let i = startIdx; i < endIdx; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                // Skip header row (first row with text like "Index", "Number", etc.)
                if (!skippedFirst) {
                  const firstCell = String(row[0] || "").toLowerCase();
                  if (
                    firstCell.includes("index") ||
                    firstCell.includes("sn") ||
                    firstCell.includes("number") ||
                    firstCell.includes("name")
                  ) {
                    skippedFirst = true;
                    continue;
                  }
                }

                row.forEach((cell) => {
                  if (!cell && cell !== 0) return;

                  // Convert to string and handle scientific notation
                  let num = String(cell).trim();

                  // Skip if it's text header
                  if (isNaN(num.replace(/[^\d]/g, "")) && num.length < 10) return;

                  // Remove all spaces, dashes, brackets, dots
                  num = num.replace(/[\s\-\(\)\.]/g, "");

                  // Extract only digits and +
                  num = num.replace(/[^\d+]/g, "");

                  // Remove + from middle/end, keep only at start
                  if (num.includes("+")) {
                    const parts = num.split("+");
                    num = parts[0] ? parts[0] : parts[1];
                    if (!num.startsWith("+")) num = "+" + num;
                  }

                  // Handle different formats
                  if (num.startsWith("+91")) {
                    num = num.substring(3);
                  } else if (num.startsWith("+")) {
                    num = num.substring(1);
                    if (num.startsWith("91")) num = num.substring(2);
                  } else if (num.startsWith("91") && num.length > 10) {
                    num = num.substring(2);
                  } else if (num.startsWith("0")) {
                    num = num.substring(1);
                  }

                  // Validate 10 digit number
                  if (/^\d{10}$/.test(num)) {
                    const fullNum = "+91" + num;
                    if (!seen.has(fullNum)) {
                      seen.add(fullNum);
                      imported.push(fullNum);
                    }
                  }
                });
              }
              
              resolve(endIdx < data.length);
            }, 0);
          });
        };

        // Process data in chunks
        let currentIndex = 0;
        while (currentIndex < data.length) {
          const hasMore = await processChunk(currentIndex);
          currentIndex += 1000;
          if (!hasMore) break;
        }

        if (imported.length === 0) {
          toast.error("No valid 10-digit numbers found in Excel file");
          return;
        }

        setCheckingCapability(true);

        const response = await api.chackcapebalNumber(imported, user._id);
        const rcsMessaging = response?.data?.rcsMessaging || response?.rcsMessaging;

        let capableNumbers = [];

        if (rcsMessaging) {
          if (rcsMessaging.reachableUsers) {
            capableNumbers = imported
              ?.filter((num) => rcsMessaging.reachableUsers?.includes(num))
              ?.map((num) => ({
                id: Date.now() + Math.random(),
                number: num,
                vars: {},
                capable: true,
              }));
          } else {
            imported.forEach((num) => {
              const userData = rcsMessaging[num];
              if (userData?.features && userData.features.length > 0) {
                capableNumbers.push({
                  id: Date.now() + Math.random(),
                  number: num,
                  vars: {},
                  capable: true,
                });
              }
            });
          }
        }

        setContacts(prev => [...prev, ...capableNumbers]);
        setCheckingCapability(false);
        toast.success(`${capableNumbers.length} numbers imported successfully`);
      } catch (error) {
        setCheckingCapability(false);
        toast.error('Error importing Excel: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const clearAllContacts = () => {
    if (confirm("Are you sure you want to clear all contacts?")) {
      setContacts([]);
    }
  };

  const removeDuplicates = () => {
    const uniqueNumbers = new Map();
    contacts.forEach((contact) => {
      if (contact.number && contact.number.length >= 13) {
        uniqueNumbers.set(contact.number, contact);
      }
    });
    const uniqueContacts = Array.from(uniqueNumbers.values());
    const removedCount = contacts.length - uniqueContacts.length;
    setContacts(uniqueContacts);
    if (removedCount > 0) {
      showResult({
        success: true,
        message: `${removedCount} duplicate number(s) removed successfully!`,
      });
    } else {
      showResult({
        success: false,
        message: "No duplicate numbers found",
      });
    }
  };

  const downloadDemoExcel = () => {
    const demoData = [
      ["Index", "Number"],
      ["1", "7201000140"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(demoData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    XLSX.writeFile(wb, "demo_contacts.xlsx");
  };

  const addButton = () => {
    setButtons([
      ...buttons,
      {
        id: Date.now(),
        type: "URL Button",
        title: "",
        value: "",
        postBackData: "SA1L1C1",
      },
    ]);
  };

  const updateButton = (id, field, value) => {
    setButtons(
      buttons?.map((b) => {
        if (b.id === id) {
          const updated = { ...b, [field]: value };
          // If changing type: auto-fill/clear title
          if (field === "type") {
            if (value === "Call Button" && !updated.title) {
              updated.title = "call now";
            }
            if (value === "URL Button") {
              updated.title = "";
            }
          }
          // Also set/clear button value when type changes
          if (field === "type") {
            if (value === "Call Button" && !updated.value) {
              updated.value = "+91";
            }
            if (value === "URL Button") {
              updated.value = "";
            }
          }
          // Auto-generate postBack data for URL buttons when value changes
          if (updated.type === "URL Button" && field === "value") {
            updated.postBackData = "SA1L1C1";
          }
          return updated;
        }
        return b;
      })
    );
  };

  const deleteButton = (id) => {
    setButtons(buttons?.filter((b) => b.id !== id));
  };

  const addCarouselCard = () => {
    setCarouselCards([
      ...carouselCards,
      { id: Date.now(), title: "", description: "", image: null, buttons: [] },
    ]);
  };

  const updateCarouselCard = (id, field, value) => {
    setCarouselCards(
      carouselCards?.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const deleteCarouselCard = (id) => {
    setCarouselCards(carouselCards?.filter((c) => c.id !== id));
  };

  const addCardButton = (cardId) => {
    setCarouselCards(
      carouselCards?.map((c) =>
        c.id === cardId
          ? {
              ...c,
              buttons: [
                ...c.buttons,
                { id: Date.now(), type: "URL Button", title: "", value: "" },
              ],
            }
          : c
      )
    );
  };

  const updateCardButton = (cardId, btnId, field, value) => {
    setCarouselCards(
      carouselCards?.map((c) =>
        c.id === cardId
          ? {
              ...c,
              buttons: c.buttons?.map((b) =>
                b.id === btnId
                  ? (() => {
                      const updated = { ...b, [field]: value };
                      if (field === "type") {
                        if (value === "Call Button" && !updated.title)
                          updated.title = "call now";
                        if (value === "URL Button") updated.title = "";
                        if (value === "Call Button" && !updated.value)
                          updated.value = "+91";
                        if (value === "URL Button") updated.value = "";
                      }
                      return updated;
                    })()
                  : b
              ),
            }
          : c
      )
    );
  };

  const deleteCardButton = (cardId, btnId) => {
    setCarouselCards(
      carouselCards.map((c) =>
        c.id === cardId
          ? { ...c, buttons: c.buttons.filter((b) => b.id !== btnId) }
          : c
      )
    );
  };

  const handleSend = async () => {
    if (templates.length === 0) {
      showResult({
        success: false,
        message: "No templates found. Please create a template first.",
      });
      setTimeout(() => {
        window.location.href = "/templates";
      }, 2000);
      return;
    }
    if (template === "new") {
      showResult({
        success: false,
        message: "Please select a template before sending message",
      });
      return;
    }
    if (!campaignName.trim()) {
      showResult({ success: false, message: "Please enter campaign name" });
      return;
    }
    if (!message && messageType !== "carousel") {
      showResult({ success: false, message: "Please enter a message" });
      return;
    }
    if (contacts.length === 0) {
      showResult({
        success: false,
        message: "Please add at least one contact",
      });
      return;
    }

    const phoneCount = contacts.length;
    const costPerPhone = 1;
    const totalCost = phoneCount * costPerPhone;

    if (user.Wallet < totalCost) {
      showResult({
        success: false,
        message: `Insufficient credits! Required: ₹${totalCost}, Available: ₹${user.Wallet}. Please recharge your wallet.`,
      });
      return;
    }

    setSending(true);

    console.log("Selected Message Type:", messageType);

    let payload = {
      phoneNumbers: contacts?.map((c) => c.number),
      templateId: template?._id,
      type: messageType,
      userId: user._id,
      campaignName: campaignName.trim(),
    };

    if (messageType === "carousel") {
      if (carouselCards.length < 2) {
        setSending(false);
        showResult({
          success: false,
          message: "Carousel requires minimum 2 cards",
        });
        return;
      }

      const validCards = carouselCards?.filter(
        (card) => card.title && card.description && card.imageUrl
      );

      if (validCards.length < 2) {
        setSending(false);
        showResult({
          success: false,
          message: "At least 2 cards must have title, description and image",
        });
        return;
      }

      payload.content = {
        richCardDetails: {
          carousel: {
            cardWidth: "MEDIUM_WIDTH",
            contents: validCards?.map((card, idx) => ({
              cardTitle: card.title,
              cardDescription: card.description,
              cardMedia: {
                contentInfo: {
                  fileUrl: card.imageUrl,
                },
                mediaHeight: "MEDIUM",
              },
              suggestions: card?.buttons
                ?.filter((btn) => btn.title && btn.value)
                ?.map((btn) => ({
                  action: {
                    plainText: btn.title,
                    postBack: {
                      data: `SA${idx + 1}L1C${idx + 1}`,
                    },
                    openUrl: {
                      url: btn.value,
                    },
                  },
                })),
            })),
          },
        },
      };
    } else if (messageType === "rcs") {
      if (!mediaUrl) {
        setSending(false);
        showResult({
          success: false,
          message: "Please upload a valid media file",
        });
        return;
      }
      if (buttons.length === 0) {
        setSending(false);
        showResult({
          success: false,
          message: "Please add at least one button for RCS message",
        });
        return;
      }

      const validButtons = buttons.filter((btn) => {
        if (!btn.title || !btn.value) return false;
        if (btn.type === "URL Button") return btn.value.startsWith("http");
        if (btn.type === "Call Button") return btn.value.startsWith("+");
        return true;
      });

      if (validButtons.length === 0) {
        setSending(false);
        showResult({
          success: false,
          message: "Please add at least one valid button (URL or Call)",
        });
        return;
      }

      payload.content = {
        richCardDetails: {
          standalone: {
            cardOrientation: "VERTICAL",
            content: {
              cardTitle: message,
              cardDescription: cardDescription,
              cardMedia: {
                mediaHeight: "TALL",
                contentInfo: {
                  fileUrl: mediaUrl,
                },
              },
              suggestions: validButtons?.map((btn) => {
                if (btn.type === "Call Button") {
                  return {
                    action: {
                      plainText: btn.title,
                      postBack: { data: "call_action" },
                      dialerAction: { phoneNumber: btn.value },
                    },
                  };
                }
                return {
                  action: {
                    plainText: btn.title,
                    postBack: { data: btn.postBackData || "SA1L1C1" },
                    openUrl: { url: btn.value },
                  },
                };
              }),
            },
          },
        },
      };
    } else if (messageType === "text-with-action") {
      if (buttons.length === 0) {
        setSending(false);
        showResult({
          success: false,
          message: "Please add at least one button for text with action",
        });
        return;
      }

      const validButtons = buttons.filter((btn) => btn.title && btn.value);

      if (validButtons.length === 0) {
        setSending(false);
        showResult({
          success: false,
          message: "Please add at least one valid button",
        });
        return;
      }

      payload.content = {
        plainText: message,
        suggestions: validButtons?.map((btn) => {
          if (btn.type === "Call Button") {
            return {
              action: {
                plainText: btn.title,
                postBack: { data: "call_action" },
                dialerAction: {
                  phoneNumber: btn.value,
                },
              },
            };
          }
          if (btn.type === "URL Button") {
            return {
              action: {
                plainText: btn.title,
                postBack: { data: btn.postBackData || "SA1L1C1" },
                openUrl: { url: btn.value },
              },
            };
          }
          return {
            reply: {
              plainText: btn.title,
              postBack: { data: btn.value },
            },
          };
        }),
      };
    } else if (messageType === "webview") {
      if (buttons.length === 0) {
        setSending(false);
        showResult({
          success: false,
          message: "Please add at least one button for webview message",
        });
        return;
      }

      const validButtons = buttons?.filter((btn) => {
        if (!btn.title) return false;
        if (btn.type === "URL Button")
          return btn.value && btn.value.startsWith("http");
        return btn.value;
      });

      if (validButtons.length === 0) {
        setSending(false);
        showResult({
          success: false,
          message: "Please add at least one valid button",
        });
        return;
      }

      payload.content = {
        plainText: message,
        suggestions: validButtons?.map((btn) => ({
          action: {
            plainText: btn.title,
            postBack: { data: btn.value || "SA1L1C1" },
            openUrl: {
              url: btn.value,
              application: "WEBVIEW",
              webviewViewMode: "TALL",
              description: btn.description || "Click to open",
            },
          },
        })),
      };
    } else if (messageType === "dialer-action") {
      if (buttons.length === 0) {
        setSending(false);
        showResult({
          success: false,
          message: "Please add at least one dialer button",
        });
        return;
      }

      const validButtons = buttons.filter(
        (btn) => btn.title && btn.value && btn.value.startsWith("+")
      );
      if (validButtons.length === 0) {
        setSending(false);
        showResult({
          success: false,
          message:
            "Please add at least one button with valid phone number starting with +",
        });
        return;
      }

      payload.content = {
        plainText: message,
        suggestions: validButtons?.map((btn) => ({
          action: {
            plainText: btn.title,
            postBack: { data: "SA1L1C1" },
            dialerAction: {
              phoneNumber: btn.value,
            },
          },
        })),
      };
    } else {
      // Default text message
      payload.content = {
        plainText: message,
      };
    }

    try {
      const response = await api.sendMessage(payload);
      console.log(response, "sscscssc");
      if (response.data.success) {
        toast.success(`Messages sent successfully!`);
        await refreshUser();

        // Redirect to reports page after 1.5 seconds
        setTimeout(() => {
          navigate("/reports");
        }, 1000);
      }
    } catch (error) {
      if (error.response?.data?.message === "Insufficient balance") {
        toast.error(
          `Insufficient credits! Required: ₹${error.response.data.required}, Available: ₹${error.response.data.available}`
        );
        showResult({
          success: false,
          message: `Insufficient credits! Required: ₹${error.response.data.required}, Available: ₹${error.response.data.available}`,
        });
      } else {
        console.log(error);
        toast.error(error?.response?.data?.message || "Failed to send message");
        // setResultData({ success: false, message: error.message || 'Failed to send message' })
      }
      // result shown via toast
    } finally {
      setSending(false);
    }
  };

  const renderMessageEditor = () => {
    if (messageType === "carousel") {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Carousel Cards</h3>
            <button
              onClick={addCarouselCard}
              className="px-2 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1 md:gap-2 text-sm md:text-base"
            >
              <FiPlus /> Add Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {carouselCards?.map((card, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-sm">Card {idx + 1}</span>
                  <button
                    onClick={() => deleteCarouselCard(card.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <input
                  name="title"
                  type="text"
                  placeholder="Card Title"
                  value={card.title}
                  onChange={(e) =>
                    updateCarouselCard(card.id, "title", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-purple-500"
                />

                <textarea
                  placeholder="Card Description"
                  value={card.description}
                  onChange={(e) =>
                    updateCarouselCard(card.id, "description", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />

                <input
                  name="imageUrl"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const uploadedUrl = await uploadFile(file);
                      if (uploadedUrl) {
                        updateCarouselCard(card.id, "imageUrl", uploadedUrl);
                      }
                    }
                  }}
                  className="w-full text-sm mb-3"
                />

                <div className="space-y-2">
                  {card?.buttons?.map((btn, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={btn.type}
                        onChange={(e) =>
                          updateCardButton(
                            card.id,
                            btn.id,
                            "type",
                            e.target.value
                          )
                        }
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="URL Button">URL Button</option>
                        <option value="Quick Reply Button">Quick Reply</option>
                      </select>
                      <input
                        name="Title"
                        type="text"
                        placeholder="Title"
                        value={btn.title}
                        onChange={(e) =>
                          updateCardButton(
                            card.id,
                            btn.id,
                            "title",
                            e.target.value
                          )
                        }
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="text"
                        name="Value"
                        placeholder="https://example.com"
                        value={btn.value || ""}
                        onChange={(e) =>
                          updateCardButton(
                            card.id,
                            btn.id,
                            "value",
                            e.target.value
                          )
                        }
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                      <button
                        onClick={() => deleteCardButton(card.id, btn.id)}
                        className="text-red-500"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addCardButton(card.id)}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    + Add Button
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (messageType === "rcs") {
      return (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-purple-600 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-purple-50 hover:border-blue-400 transition-colors">
            <label className="cursor-pointer">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <FiUpload className="text-3xl text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Upload Media File
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Click to browse or drag and drop
                </p>
                <p className="text-xs text-gray-400">
                  Supports: Images & Videos
                </p>
              </div>
              <input
                name="Upload"
                type="file"
                accept="image/*,video/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const uploadedUrl = await uploadFile(file);
                    if (uploadedUrl) {
                      setMediaUrl(uploadedUrl);
                      setMediaFile(null);
                    }
                  }
                }}
                className="hidden"
              />
            </label>
            {mediaUrl && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <FiCheck className="text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Media uploaded successfully!
                </span>
              </div>
            )}
          </div>

          {/* <input
            type="text"
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            placeholder="Footer text (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          /> */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          <textarea
            value={cardDescription}
            onChange={(e) => setCardDescription(e.target.value)}
            placeholder="Card Description (optional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={2}
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Action Buttons
              </label>
              <button
                onClick={addButton}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Button
              </button>
            </div>
            {buttons?.map((btn, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <select
                  value={btn.type}
                  onChange={(e) => updateButton(btn.id, "type", e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  {BUTTON_TYPES?.map((t, idx) => (
                    <option key={idx} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  name="Upload"
                  type="text"
                  placeholder="Button Title"
                  value={btn.title}
                  onChange={(e) =>
                    updateButton(btn.id, "title", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  name="Upload"
                  placeholder={
                    btn.type === "Call Button"
                      ? "+919876543210"
                      : "https://example.com"
                  }
                  value={btn.value || ""}
                  onChange={(e) =>
                    updateButton(btn.id, "value", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <button
                  onClick={() => deleteButton(btn.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (messageType === "text-with-action") {
      return (
        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Action Buttons
              </label>
              <button
                onClick={addButton}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Button
              </button>
            </div>
            {buttons?.map((btn, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <select
                  value={btn.type}
                  onChange={(e) => updateButton(btn.id, "type", e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  {BUTTON_TYPES?.map((t, idx) => (
                    <option key={idx} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  name="Button Title"
                  type="text"
                  placeholder="Button Title"
                  value={btn.title}
                  onChange={(e) =>
                    updateButton(btn.id, "title", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <input
                  name="URL/Phone"
                  type="text"
                  placeholder="URL/Phone"
                  value={btn.value}
                  onChange={(e) =>
                    updateButton(btn.id, "value", e.target.value)
                  }
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <button
                  onClick={() => deleteButton(btn.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (messageType === "webview") {
      return (
        <div className="space-y-4">
          <textarea
            id="textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Visit this URL to find more about Jiosphere"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Webview Buttons
              </label>
              <button
                onClick={addButton}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Button
              </button>
            </div>
            {buttons?.map((btn, idx) => (
              <div
                key={idx}
                className="space-y-2 mb-4 p-3 border rounded-lg bg-blue-50"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="title1"
                    type="text"
                    placeholder="Button Title"
                    value={btn.title}
                    onChange={(e) =>
                      updateButton(btn.id, "title", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    onClick={() => deleteButton(btn.id)}
                    className="text-red-500 hover:text-red-700 self-start sm:self-center"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <input
                  name="value"
                  type="text"
                  placeholder="https://example.com"
                  value={btn.value || ""}
                  onChange={(e) =>
                    updateButton(btn.id, "value", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  name="Description"
                  type="text"
                  placeholder="Description (optional)"
                  value={btn.description || ""}
                  onChange={(e) =>
                    updateButton(btn.id, "description", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (messageType === "dialer-action") {
      return (
        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Call this Number to Know More about Jio Assistants"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Dialer Action Button
              </label>
              <button
                onClick={addButton}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Button
              </button>
            </div>
            {buttons?.map((btn, idx) => (
              <div
                key={idx}
                className="space-y-2 mb-4 p-3 border rounded-lg bg-green-50"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    name="Button Title"
                    id="title"
                    type="text"
                    placeholder="Button Title (e.g., Dial Now)"
                    value={btn.title}
                    onChange={(e) =>
                      updateButton(btn.id, "title", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    onClick={() => deleteButton(btn.id)}
                    className="text-red-500 hover:text-red-700 self-start sm:self-center"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <input
                  id="title"
                  name="Button data"
                  type="text"
                  placeholder="+916367992981"
                  value={btn.value || ""}
                  onChange={(e) =>
                    updateButton(btn.id, "value", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <textarea
        name="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your message"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        rows={6}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Send Message
              </h1>
              <p className="text-gray-600">
                Create and send RCS messages to your contacts
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm md:text-base">
                  Balance: ₹{user?.Wallet?.toFixed(2) || "0.00"}
                </span>
                <button
                  onClick={() => setShowAddMoney(true)}
                  className="px-2 md:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm md:text-base"
                >
                  Add Money
                </button>
                <button
                  onClick={async () => {
                    setRefreshing(true);
                    await refreshUser();
                    setRefreshing(false);
                  }}
                  disabled={refreshing}
                  className="px-2 md:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-1 text-sm md:text-base"
                >
                  {refreshing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden md:inline">Refreshing</span>
                    </>
                  ) : (
                    "Refresh"
                  )}
                </button>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-2 md:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center gap-1 md:gap-2 text-sm md:text-base"
              >
                <FiEye /> {showPreview ? "Hide" : "Show"} Preview
              </button>
            </div>
          </div>

          {showPreview && (
            <ModernTemplatePreview
              selectedTemplate={{ name: MESSAGE_TYPES[messageType] }}
              message={message}
              messageType={MESSAGE_TYPES[messageType]}
              templateMedia={
                mediaUrl
                  ? { type: "url", url: mediaUrl }
                  : mediaFile
                  ? { type: "file", name: mediaFile.name }
                  : null
              }
              templateButtons={buttons}
              templateFooter={footer}
              carouselCards={carouselCards}
            />
          )}

          {messageType === "text" && (
            <ModernTemplatePreview
              selectedTemplate={{ name: MESSAGE_TYPES[messageType] }}
              message={message}
              messageType={MESSAGE_TYPES[messageType]}
              templateMedia={null}
              templateButtons={[]}
              templateFooter={""}
              carouselCards={[]}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template
              </label>
              <select
                value={template}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">New Message</option>
                {templates?.map((tmpl, idx) => (
                  <option key={idx} value={tmpl?._id}>
                    {tmpl?.name} (
                    {MESSAGE_TYPES[tmpl.messageType] || tmpl.messageType})
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong> {selectedTemplate.name} -{" "}
                    {MESSAGE_TYPES[selectedTemplate.messageType]}
                  </p>
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Message Type
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(MESSAGE_TYPES)?.map(([key, label], idx) => (
                  <option key={idx} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <FiCheck
                className="absolute right-10 top-11 text-green-500"
                size={20}
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-medium text-gray-700">
                <span className="text-red-500">*</span> Contacts (
                {contacts.length})
              </label>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <button
                  onClick={downloadDemoExcel}
                  className="px-2 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1 text-sm md:text-base"
                >
                  <FiUpload /> Download semple
                </button>
                <button
                  onClick={removeDuplicates}
                  className="px-2 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1 md:gap-2 text-sm md:text-base"
                >
                  <FiX /> Remove Duplicates
                </button>
                <button
                  onClick={clearAllContacts}
                  className="px-2 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 md:gap-2 text-sm md:text-base"
                >
                  <FiTrash2 /> Clear All
                </button>
                <label
                  className={`px-2 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                    checkingCapability ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {checkingCapability ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <FiUpload /> Import Excel
                    </>
                  )}
                  <input
                    name="upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={importExcel}
                    className="hidden"
                    disabled={checkingCapability}
                  />
                </label>
                <button
                  onClick={() => setShowManualImport(true)}
                  className={`px-2 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 md:gap-2 text-sm md:text-base ${
                    checkingCapability ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={checkingCapability}
                >
                  <FiPlus /> Manual Import
                </button>
                {/* <button onClick={() => setShowCountryCode(true)} className="px-2 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 md:gap-2 text-sm md:text-base">
                  Insert Country Code
                </button> */}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <VirtualizedContactList 
                contacts={contacts}
                updateContact={updateContact}
                deleteContact={deleteContact}
              />
            </div>
          </div>

          <div>
            {checkingCapability && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 font-medium">
                  Checking RCS capability...
                </span>
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-3">
              <span className="text-red-500">*</span> Message Content
            </label>
            {renderMessageEditor()}
          </div>

          {/* Campaign Name and Send Button */}
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="w-full md:w-96">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Campaign Name
              </label>
              <input
                name="Enter campaign name"
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 flex items-center gap-2 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-7"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <FiSend /> Send Message
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Money to Wallet</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  name="setAddAmount"
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000]?.map((amount, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAddAmount(amount.toString())}
                    className="px-3 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddMoney(false);
                    setAddAmount("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (addAmount && parseFloat(addAmount) > 0) {
                      try {
                        const data = await api.addWalletRequest({
                          amount: parseFloat(addAmount),
                          userId: user._id,
                        });

                        if (data.success) {
                          toast.success(
                            `Wallet recharge request of ₹${addAmount} submitted for admin approval!`
                          );
                          setAddAmount("");
                          setShowAddMoney(false);
                          await refreshUser();
                        } else {
                          toast.error(
                            "Failed to submit request: " + data.message
                          );
                        }
                      } catch (error) {
                        toast.error(
                          "Error submitting request: " + error.message
                        );
                      }
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add Money
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Country Code Modal */}
      {showCountryCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Country Code</h3>
              <button
                onClick={() => {
                  setShowCountryCode(false);
                  setCountrySearch("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  name="Search country"
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                {filteredCountries?.map((country, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedCountryCode(country.code)}
                    className={`px-4 py-3 cursor-pointer hover:bg-blue-50 ${
                      selectedCountryCode === country.code ? "bg-blue-100" : ""
                    }`}
                  >
                    <span className="text-sm">
                      [{country.short}] {country.name} ({country.code})
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCountryCode(false);
                    setCountrySearch("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={applyCountryCode}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Import Modal */}
      {showManualImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manual Import</h3>
              <button
                onClick={() => {
                  setShowManualImport(false);
                  setManualNumbers("");
                  setParsedNumbers([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Phone Numbers
                </label>
                <textarea
                  value={manualNumbers}
                  onChange={(e) => {
                    setManualNumbers(e.target.value);
                    parseManualNumbers(e.target.value);
                  }}
                  placeholder="Enter numbers (one per line)&#10;Format: 9876543210 or name,9876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Line per number, you can name by enter name comma then mobile
                  (name,number)
                </p>
                {/* <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 font-medium">⚠️ Important: You can add only 1 number OR minimum 500 numbers. Between 2-499 is not allowed.</p>
                </div> */}
              </div>

              {parsedNumbers.length > 0 && (
                <>
                  {/* <div className={`p-3 rounded-lg border ${
                    parsedNumbers.length === 1 || parsedNumbers.length >= 500 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      parsedNumbers.length === 1 || parsedNumbers.length >= 500 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      {parsedNumbers.length === 1 || parsedNumbers.length >= 500 
                        ? `✓ Valid count: ${parsedNumbers.length} number(s)` 
                        : `✗ Invalid count: ${parsedNumbers.length} numbers (Need 1 or 500+)`
                      }
                    </p>
                  </div> */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                              SN
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                              Number
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedNumbers?.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm border-b">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-2 text-sm border-b">
                                {item.name || "-"}
                              </td>
                              <td className="px-4 py-2 text-sm border-b">
                                {item.number}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowManualImport(false);
                    setManualNumbers("");
                    setParsedNumbers([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={importManualNumbers}
                  disabled={parsedNumbers.length === 0 || checkingCapability}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingCapability ? "Checking..." : "Import"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result shown via toast notifications */}
    </div>
  );
}
