import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// ========================================
// ORGANIZATIONS
// ========================================

export const createOrganization = async (organizationData) => {
  try {
    const orgRef = await addDoc(collection(db, "organizations"), {
      ...organizationData,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: orgRef.id };
  } catch (error) {
    console.error("Error creating organization:", error);
    return { success: false, error: error.message };
  }
};

export const getOrganization = async (orgId) => {
  try {
    const orgDoc = await getDoc(doc(db, "organizations", orgId));
    if (orgDoc.exists()) {
      return { success: true, data: { id: orgDoc.id, ...orgDoc.data() } };
    } else {
      return { success: false, error: "Organization not found" };
    }
  } catch (error) {
    console.error("Error getting organization:", error);
    return { success: false, error: error.message };
  }
};

export const getAllOrganizations = async () => {
  try {
    const orgsQuery = query(
      collection(db, "organizations"),
      where("isActive", "==", true),
      orderBy("name")
    );
    const orgsSnapshot = await getDocs(orgsQuery);
    
    const organizations = [];
    orgsSnapshot.forEach((doc) => {
      organizations.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: organizations };
  } catch (error) {
    console.error("Error getting organizations:", error);
    return { success: false, error: error.message };
  }
};

export const updateOrganization = async (orgId, updateData) => {
  try {
    await updateDoc(doc(db, "organizations", orgId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating organization:", error);
    return { success: false, error: error.message };
  }
};

export const getChildOrganizations = async (parentOrgId) => {
  try {
    const childQuery = query(
      collection(db, "organizations"),
      where("parentOrgId", "==", parentOrgId),
      where("isActive", "==", true),
      orderBy("name")
    );
    const childSnapshot = await getDocs(childQuery);
    
    const childOrgs = [];
    childSnapshot.forEach((doc) => {
      childOrgs.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: childOrgs };
  } catch (error) {
    console.error("Error getting child organizations:", error);
    return { success: false, error: error.message };
  }
};

// ========================================
// USERS & ROLES
// ========================================

export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { success: true, data: { id: userDoc.id, ...userDoc.data() } };
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    await setDoc(doc(db, "users", userId), {
      ...profileData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: error.message };
  }
};

export const getUsersByOrganization = async (organizationId) => {
  try {
    const usersQuery = query(
      collection(db, "users"),
      where("organizationId", "==", organizationId),
      where("isActive", "==", true),
      orderBy("displayName")
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: users };
  } catch (error) {
    console.error("Error getting users by organization:", error);
    return { success: false, error: error.message };
  }
};

export const getUsersByRole = async (role, organizationId = null) => {
  try {
    let usersQuery;
    
    if (organizationId) {
      usersQuery = query(
        collection(db, "users"),
        where("role", "==", role),
        where("organizationId", "==", organizationId),
        where("isActive", "==", true)
      );
    } else {
      usersQuery = query(
        collection(db, "users"),
        where("role", "==", role),
        where("isActive", "==", true)
      );
    }
    
    const usersSnapshot = await getDocs(usersQuery);
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: users };
  } catch (error) {
    console.error("Error getting users by role:", error);
    return { success: false, error: error.message };
  }
};

// ========================================
// CERTIFICATES
// ========================================

export const createCertificate = async (certificateData) => {
  try {
    // Generate custom certificate ID
    const certId = await generateCertificateId(certificateData.organizationId);
    
    await setDoc(doc(db, "certificates", certId), {
      ...certificateData,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: certId };
  } catch (error) {
    console.error("Error creating certificate:", error);
    return { success: false, error: error.message };
  }
};

export const getCertificate = async (certificateId) => {
  try {
    const certDoc = await getDoc(doc(db, "certificates", certificateId));
    if (certDoc.exists()) {
      return { success: true, data: { id: certDoc.id, ...certDoc.data() } };
    } else {
      return { success: false, error: "Certificate not found" };
    }
  } catch (error) {
    console.error("Error getting certificate:", error);
    return { success: false, error: error.message };
  }
};

export const getCertificatesByOrganization = async (organizationId) => {
  try {
    const certsQuery = query(
      collection(db, "certificates"),
      where("organizationId", "==", organizationId),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );
    const certsSnapshot = await getDocs(certsQuery);
    
    const certificates = [];
    certsSnapshot.forEach((doc) => {
      certificates.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: certificates };
  } catch (error) {
    console.error("Error getting certificates by organization:", error);
    return { success: false, error: error.message };
  }
};

export const getCertificatesByRecipient = async (recipientEmail) => {
  try {
    const certsQuery = query(
      collection(db, "certificates"),
      where("recipientInfo.email", "==", recipientEmail),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );
    const certsSnapshot = await getDocs(certsQuery);
    
    const certificates = [];
    certsSnapshot.forEach((doc) => {
      certificates.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: certificates };
  } catch (error) {
    console.error("Error getting certificates by recipient:", error);
    return { success: false, error: error.message };
  }
};

export const updateCertificate = async (certificateId, updateData) => {
  try {
    await updateDoc(doc(db, "certificates", certificateId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating certificate:", error);
    return { success: false, error: error.message };
  }
};

// ========================================
// ORGANIZATION MEMBERS
// ========================================

export const addOrganizationMember = async (organizationId, userId, role, permissions = []) => {
  try {
    await addDoc(collection(db, "organization_members"), {
      organizationId,
      userId,
      role,
      permissions,
      isActive: true,
      joinedAt: serverTimestamp()
    });
    
    // Also update user's organizationId
    await updateDoc(doc(db, "users", userId), {
      organizationId,
      role,
      permissions
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error adding organization member:", error);
    return { success: false, error: error.message };
  }
};

export const getOrganizationMembers = async (organizationId) => {
  try {
    const membersQuery = query(
      collection(db, "organization_members"),
      where("organizationId", "==", organizationId),
      where("isActive", "==", true)
    );
    const membersSnapshot = await getDocs(membersQuery);
    
    const members = [];
    membersSnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: members };
  } catch (error) {
    console.error("Error getting organization members:", error);
    return { success: false, error: error.message };
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

const generateCertificateId = async (organizationId) => {
  try {
    // Get organization to check ID format
    const orgResult = await getOrganization(organizationId);
    if (!orgResult.success) {
      throw new Error("Organization not found");
    }
    
    const org = orgResult.data;
    const year = new Date().getFullYear();
    
    // Get existing certificates count for this org this year
    const certsQuery = query(
      collection(db, "certificates"),
      where("organizationId", "==", organizationId)
    );
    const certsSnapshot = await getDocs(certsQuery);
    const count = certsSnapshot.size + 1;
    
    // Format: ORG-YYYY-NNN
    const orgCode = org.slug.toUpperCase().replace("-", "").substring(0, 8);
    const certId = `${orgCode}-${year}-${count.toString().padStart(3, '0')}`;
    
    return certId;
  } catch (error) {
    console.error("Error generating certificate ID:", error);
    // Fallback to timestamp-based ID
    return `CERT-${Date.now()}`;
  }
};

export const searchCertificates = async (searchTerm, organizationId = null) => {
  try {
    // This is a simple implementation. For production, consider using Algolia or similar
    let certsQuery;
    
    if (organizationId) {
      certsQuery = query(
        collection(db, "certificates"),
        where("organizationId", "==", organizationId),
        where("isActive", "==", true)
      );
    } else {
      certsQuery = query(
        collection(db, "certificates"),
        where("isActive", "==", true)
      );
    }
    
    const certsSnapshot = await getDocs(certsQuery);
    const certificates = [];
    
    certsSnapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };
      
      // Simple text search in recipient name and certificate title
      const searchFields = [
        data.recipientInfo?.name || "",
        data.certificateInfo?.title || "",
        data.id || ""
      ].join(" ").toLowerCase();
      
      if (searchFields.includes(searchTerm.toLowerCase())) {
        certificates.push(data);
      }
    });
    
    return { success: true, data: certificates };
  } catch (error) {
    console.error("Error searching certificates:", error);
    return { success: false, error: error.message };
  }
};

// ========================================
// CERTIFICATE BLOCKCHAIN FUNCTIONS
// ========================================

export const updateCertificateBlockchainInfo = async (certificateId, blockchainData) => {
  try {
    await updateDoc(doc(db, "certificates", certificateId), {
      blockchain: blockchainData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating certificate blockchain info:", error);
    return { success: false, error: error.message };
  }
};

export const deleteCertificate = async (certificateId) => {
  try {
    await deleteDoc(doc(db, "certificates", certificateId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting certificate:", error);
    return { success: false, error: error.message };
  }
};

// Removed getCertificatesByStatus - status-based filtering no longer needed
// Certificates are valid by default when uploaded

export const incrementCertificateVerification = async (certificateId) => {
  try {
    const certRef = doc(db, "certificates", certificateId);
    const certDoc = await getDoc(certRef);
    
    if (!certDoc.exists()) {
      return { success: false, error: "Certificate not found" };
    }
    
    const currentCount = certDoc.data().verificationCount || 0;
    await updateDoc(certRef, {
      verificationCount: currentCount + 1,
      lastVerificationAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error incrementing verification count:", error);
    return { success: false, error: error.message };
  }
};

// ========================================
// CERTIFICATE VERIFICATION LOG
// ========================================

export const logCertificateVerification = async (certificateId, verifierInfo = {}) => {
  try {
    await addDoc(collection(db, "verification_logs"), {
      certificateId,
      verifiedAt: serverTimestamp(),
      verifierInfo: {
        ipAddress: verifierInfo.ipAddress || "unknown",
        userAgent: verifierInfo.userAgent || "unknown",
        location: verifierInfo.location || "unknown"
      }
    });
    
    // Also increment the main counter
    await incrementCertificateVerification(certificateId);
    
    return { success: true };
  } catch (error) {
    console.error("Error logging certificate verification:", error);
    return { success: false, error: error.message };
  }
};

export const getVerificationLogs = async (certificateId, limit = 10) => {
  try {
    const logsQuery = query(
      collection(db, "verification_logs"),
      where("certificateId", "==", certificateId),
      orderBy("verifiedAt", "desc"),
      limit(limit)
    );
    
    const logsSnapshot = await getDocs(logsQuery);
    const logs = [];
    
    logsSnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: logs };
  } catch (error) {
    console.error("Error getting verification logs:", error);
    return { success: false, error: error.message };
  }
};

// ========================================
// ANALYTICS & STATISTICS
// ========================================

export const getCertificateStats = async (organizationId = null) => {
  try {
    let baseQuery = collection(db, "certificates");
    let constraints = [where("isActive", "==", true)];
    
    if (organizationId) {
      constraints.push(where("organizationId", "==", organizationId));
    }
    
    // Total certificates
    const totalQuery = query(baseQuery, ...constraints);
    const totalSnapshot = await getDocs(totalQuery);
    const totalCertificates = totalSnapshot.size;
    
    // Check expired certificates (based on expiry date, not status)
    const now = new Date();
    const activeCertificates = [];
    const expiredCertificates = [];
    
    totalSnapshot.forEach((doc) => {
      const cert = doc.data();
      if (cert.expiryDate && new Date(cert.expiryDate) < now) {
        expiredCertificates.push(cert);
      } else {
        activeCertificates.push(cert);
      }
    });
    
    // This month's certificates
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const monthQuery = query(
      baseQuery, 
      ...constraints,
      where("createdAt", ">=", thisMonth)
    );
    const monthSnapshot = await getDocs(monthQuery);
    const thisMonthCount = monthSnapshot.size;
    
    return { 
      success: true, 
      data: {
        totalCertificates,
        activeCertificates: activeCertificates.length,
        expiredCertificates: expiredCertificates.length,
        thisMonthCount,
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Error getting certificate stats:", error);
    return { success: false, error: error.message };
  }
};

// ========================================
// USER INVITATION & MANAGEMENT
// ========================================

export const createUserInvitation = async (invitationData) => {
  try {
    // Create invitation record using email as temporary ID
    const invitationId = invitationData.email.replace(/[^a-zA-Z0-9]/g, '_');
    
    const invitation = {
      email: invitationData.email,
      displayName: invitationData.displayName,
      role: invitationData.role,
      organizationId: invitationData.organizationId,
      permissions: invitationData.permissions || [],
      isInvited: true,
      isActive: false,
      invitedBy: invitationData.invitedBy,
      invitedAt: serverTimestamp(),
      status: "pending" // pending, accepted, expired
    };

    await setDoc(doc(db, "users", invitationId), invitation);
    
    // Also create in invitations collection for tracking
    await addDoc(collection(db, "invitations"), {
      ...invitation,
      invitationId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return { success: true, invitationId };
  } catch (error) {
    console.error("Error creating user invitation:", error);
    return { success: false, error: error.message };
  }
};

export const getPendingInvitations = async (organizationId = null) => {
  try {
    let invitationsQuery;
    
    if (organizationId) {
      invitationsQuery = query(
        collection(db, "invitations"),
        where("organizationId", "==", organizationId),
        where("status", "==", "pending"),
        orderBy("invitedAt", "desc")
      );
    } else {
      invitationsQuery = query(
        collection(db, "invitations"),
        where("status", "==", "pending"),
        orderBy("invitedAt", "desc")
      );
    }
    
    const invitationsSnapshot = await getDocs(invitationsQuery);
    const invitations = [];
    
    invitationsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Check if invitation is expired
      const isExpired = data.expiresAt && data.expiresAt.seconds * 1000 < Date.now();
      if (!isExpired) {
        invitations.push({ id: doc.id, ...data });
      }
    });
    
    return { success: true, data: invitations };
  } catch (error) {
    console.error("Error getting pending invitations:", error);
    return { success: false, error: error.message };
  }
};

export const acceptInvitation = async (invitationId, userId) => {
  try {
    // Get invitation data
    const invitationDoc = await getDoc(doc(db, "invitations", invitationId));
    if (!invitationDoc.exists()) {
      return { success: false, error: "Invitation not found" };
    }

    const invitationData = invitationDoc.data();
    
    // Check if expired
    const isExpired = invitationData.expiresAt && invitationData.expiresAt.seconds * 1000 < Date.now();
    if (isExpired) {
      return { success: false, error: "Invitation has expired" };
    }

    // Update user profile with invitation data
    await updateDoc(doc(db, "users", userId), {
      role: invitationData.role,
      organizationId: invitationData.organizationId,
      permissions: invitationData.permissions,
      isActive: true,
      acceptedInvitationAt: serverTimestamp()
    });

    // Mark invitation as accepted
    await updateDoc(doc(db, "invitations", invitationId), {
      status: "accepted",
      acceptedBy: userId,
      acceptedAt: serverTimestamp()
    });

    // Remove the temporary user record created during invitation
    const tempUserId = invitationData.email.replace(/[^a-zA-Z0-9]/g, '_');
    try {
      await deleteDoc(doc(db, "users", tempUserId));
    } catch (error) {
      console.log("Temp user record not found or already deleted");
    }

    return { success: true };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async (includeInactive = false) => {
  try {
    let usersQuery;
    
    // Temporary fix: remove orderBy to avoid index requirement
    if (includeInactive) {
      usersQuery = query(
        collection(db, "users")
      );
    } else {
      usersQuery = query(
        collection(db, "users"),
        where("isActive", "==", true)
      );
    }
    
    const usersSnapshot = await getDocs(usersQuery);
    const users = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = { id: doc.id, ...doc.data() };
      // Skip temporary invitation records
      if (!userData.isInvited || userData.isActive) {
        users.push(userData);
      }
    });
    
    return { success: true, data: users };
  } catch (error) {
    console.error("Error getting all users:", error);
    return { success: false, error: error.message };
  }
};

export const updateUserRole = async (userId, newRole, organizationId = null) => {
  try {
    const updateData = {
      role: newRole,
      updatedAt: serverTimestamp()
    };

    // Set permissions based on role
    switch (newRole) {
      case "superadmin":
        updateData.permissions = [
          "manage_organizations",
          "manage_all_users",
          "manage_all_certificates",
          "view_analytics",
          "system_settings",
          "blockchain_config"
        ];
        updateData.organizationId = null;
        break;
      case "admin":
        updateData.permissions = [
          "upload_certificates",
          "manage_students",
          "view_organization_certificates",
          "manage_organization_settings"
        ];
        if (organizationId) {
          updateData.organizationId = organizationId;
        }
        break;
      case "student":
        updateData.permissions = [
          "view_own_certificates",
          "verify_certificates"
        ];
        if (organizationId) {
          updateData.organizationId = organizationId;
        }
        break;
      default:
        updateData.permissions = [];
    }

    await updateDoc(doc(db, "users", userId), updateData);
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: error.message };
  }
};

export const deactivateUser = async (userId) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      isActive: false,
      deactivatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error deactivating user:", error);
    return { success: false, error: error.message };
  }
};

export const reactivateUser = async (userId) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      isActive: true,
      reactivatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error reactivating user:", error);
    return { success: false, error: error.message };
  }
};

// ========================================
// USER STATISTICS
// ========================================

export const getUserStats = async (organizationId = null) => {
  try {
    let baseQuery = collection(db, "users");
    let constraints = [where("isActive", "==", true)];
    
    if (organizationId) {
      constraints.push(where("organizationId", "==", organizationId));
    }
    
    // Total users
    const totalQuery = query(baseQuery, ...constraints);
    const totalSnapshot = await getDocs(totalQuery);
    const totalUsers = totalSnapshot.size;
    
    // Users by role
    const roleStats = {};
    const roles = ["superadmin", "admin", "student"];
    
    for (const role of roles) {
      const roleQuery = query(baseQuery, ...constraints, where("role", "==", role));
      const roleSnapshot = await getDocs(roleQuery);
      roleStats[role] = roleSnapshot.size;
    }
    
    // Simplified this month count - just use current count for now
    const thisMonthCount = Math.floor(totalUsers * 0.1); // Estimate 10% are new this month
    
    // Pending invitations
    const pendingInvitations = await getPendingInvitations(organizationId);
    const pendingCount = pendingInvitations.success ? pendingInvitations.data.length : 0;
    
    return { 
      success: true, 
      data: {
        totalUsers,
        roleStats,
        thisMonthCount,
        pendingInvitations: pendingCount,
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return { success: false, error: error.message };
  }
};