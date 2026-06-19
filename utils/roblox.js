'use strict';

const axios = require('axios');

const API = {
  users:     'https://users.roblox.com/v1',
  presence:  'https://presence.roblox.com/v1',
  thumbnails:'https://thumbnails.roblox.com/v1',
  games:     'https://games.roblox.com/v1',
  groups:    'https://groups.roblox.com/v1',
  economy:   'https://economy.roblox.com/v1',
  friends:   'https://friends.roblox.com/v1',
  catalog:   'https://catalog.roblox.com/v1',
  badges:    'https://badges.roblox.com/v1',
  inventory: 'https://inventory.roblox.com/v1',
  avatar:    'https://avatar.roblox.com/v1',
};

async function get(url, cookie = null) {
  const headers = cookie ? { Cookie: `.ROBLOSECURITY=${cookie}` } : {};
  const res = await axios.get(url, { headers, timeout: 8000 });
  return res.data;
}

async function post(url, body, cookie) {
  const res = await axios.post(url, body, {
    headers: { Cookie: `.ROBLOSECURITY=${cookie}`, 'Content-Type': 'application/json' },
    timeout: 8000,
  });
  return res.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// User lookup
// ─────────────────────────────────────────────────────────────────────────────

async function getUserByUsername(username) {
  const data = await post(`${API.users}/usernames/users`, { usernames: [username], excludeBannedUsers: false }, null);
  return data.data?.[0] ?? null;
}

async function getUserById(id) {
  return get(`${API.users}/users/${id}`);
}

async function getUsersByIds(ids) {
  const data = await post(`${API.users}/users`, { userIds: ids, excludeBannedUsers: false }, null);
  return data.data ?? [];
}

async function searchUsers(keyword) {
  const data = await get(`${API.users}/users/search?keyword=${encodeURIComponent(keyword)}&limit=10`);
  return data.data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Presence
// ─────────────────────────────────────────────────────────────────────────────

async function getUserPresence(userIds) {
  const data = await post(`${API.presence}/presence/users`, { userIds }, null);
  return data.userPresences ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Thumbnails
// ─────────────────────────────────────────────────────────────────────────────

async function getHeadshot(userId, size = '420x420') {
  const data = await get(
    `${API.thumbnails}/users/avatar-headshot?userIds=${userId}&size=${size}&format=Png&isCircular=false`
  );
  return data.data?.[0]?.imageUrl ?? null;
}

async function getAvatarThumbnail(userId, size = '420x420') {
  const data = await get(
    `${API.thumbnails}/users/avatar?userIds=${userId}&size=${size}&format=Png`
  );
  return data.data?.[0]?.imageUrl ?? null;
}

async function getGroupIcon(groupId, size = '420x420') {
  const data = await get(
    `${API.thumbnails}/groups/icons?groupIds=${groupId}&size=${size}&format=Png`
  );
  return data.data?.[0]?.imageUrl ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Games
// ─────────────────────────────────────────────────────────────────────────────

async function getGameInfo(universeId) {
  const data = await get(`${API.games}/games?universeIds=${universeId}`);
  return data.data?.[0] ?? null;
}

async function getUserGames(userId) {
  const data = await get(`${API.games}/games/list?model.userId=${userId}&model.limit=10`);
  return data.data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Groups
// ─────────────────────────────────────────────────────────────────────────────

async function getGroupInfo(groupId) {
  return get(`${API.groups}/groups/${groupId}`);
}

async function getGroupMembers(groupId, limit = 10) {
  const data = await get(`${API.groups}/groups/${groupId}/users?limit=${limit}`);
  return data.data ?? [];
}

async function getGroupWall(groupId, limit = 10) {
  const data = await get(`${API.groups}/groups/${groupId}/wall/posts?limit=${limit}`);
  return data.data ?? [];
}

async function getUserGroups(userId) {
  const data = await get(`${API.groups}/users/${userId}/groups/roles`);
  return data.data ?? [];
}

async function getUserRankInGroup(userId, groupId) {
  const groups = await getUserGroups(userId);
  return groups.find(g => String(g.group?.id) === String(groupId)) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Friends
// ─────────────────────────────────────────────────────────────────────────────

async function getUserFriends(userId) {
  const data = await get(`${API.friends}/users/${userId}/friends`);
  return data.data ?? [];
}

async function getFriendCount(userId) {
  const data = await get(`${API.friends}/users/${userId}/friends/count`);
  return data.count ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Economy / RAP
// ─────────────────────────────────────────────────────────────────────────────

async function getUserRap(userId) {
  const data = await get(`${API.economy}/users/${userId}/assets/collectibles?limit=100`);
  const items = data.data ?? [];
  return items.reduce((sum, item) => sum + (item.recentAveragePrice || 0), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────────────────

async function getCatalogItem(itemId) {
  return get(`${API.catalog}/catalog/items/details?itemIds=${itemId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Badges
// ─────────────────────────────────────────────────────────────────────────────

async function getUserBadges(userId) {
  const data = await get(`${API.badges}/users/${userId}/badges?limit=25&sortOrder=Desc`);
  return data.data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar / Outfit
// ─────────────────────────────────────────────────────────────────────────────

async function getUserAvatar(userId) {
  return get(`${API.avatar}/users/${userId}/avatar`);
}

async function getUserOutfits(userId) {
  const data = await get(`${API.avatar}/users/${userId}/outfits?page=1&itemsPerPage=10`);
  return data.data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated helpers (require cookie)
// ─────────────────────────────────────────────────────────────────────────────

async function getAuthenticatedUser(cookie) {
  return get(`${API.users}/users/authenticated`, cookie);
}

async function getCsrfToken(cookie) {
  try {
    await axios.post('https://auth.roblox.com/v2/logout', {}, {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
    });
  } catch (e) {
    return e.response?.headers?.['x-csrf-token'] ?? null;
  }
  return null;
}

// getGroups: alias for getUserGroups (used by ranksync)
const getGroups = getUserGroups;

// getUser: alias for getUserByUsername (used by roblox/ subcommands)
const getUser = getUserByUsername;

// getGroup: alias for getGroupInfo (used by setgroup.js)
const getGroup = getGroupInfo;

async function getGroupRoles(groupId, cookie = null) {
  const data = await get(`https://groups.roblox.com/v1/groups/${groupId}/roles`, cookie);
  return data.roles ?? [];
}

async function searchCatalog(query, category = '0') {
  const data = await get(`https://catalog.roblox.com/v1/search/items?category=${category}&keyword=${encodeURIComponent(query)}&limit=20&salesTypeFilter=1`);
  return data.data ?? [];
}

async function rankUser(groupId, userId, roleId, cookie) {
  if (!cookie) throw new Error('No Roblox cookie configured. Use .verify setcookie <cookie> first.');
  const csrf = await getCsrfToken(cookie);
  try {
    await axios.patch(
      `https://groups.roblox.com/v1/groups/${groupId}/users/${userId}`,
      { roleId: parseInt(roleId) },
      { headers: { Cookie: `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrf, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    throw new Error(e.response?.data?.errors?.[0]?.message || e.message);
  }
}

async function setGroupShout(groupId, message, cookie) {
  if (!cookie) throw new Error('No Roblox cookie configured. Use .verify setcookie <cookie> first.');
  const csrf = await getCsrfToken(cookie);
  try {
    await axios.patch(
      `https://groups.roblox.com/v1/groups/${groupId}/status`,
      { message },
      { headers: { Cookie: `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrf, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    throw new Error(e.response?.data?.errors?.[0]?.message || e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dominant colour extraction (uses full-body avatar thumbnail)
// ─────────────────────────────────────────────────────────────────────────────

async function getDominantColor(imageUrl) {
  try {
    const sharp = require('sharp');
    const res = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 8000 });
    const buf = Buffer.from(res.data);
    // Resize to 1×1 — gives the weighted average of every pixel (i.e. dominant hue)
    const { data } = await sharp(buf)
      .resize(1, 1, { kernel: 'cubic' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return (data[0] << 16) | (data[1] << 8) | data[2];
  } catch {
    return 0x000000; // fallback to black
  }
}

async function acceptJoinRequest(groupId, userId, cookie) {
  if (!cookie) throw new Error('no Roblox cookie configured');
  const csrf = await getCsrfToken(cookie);
  try {
    await axios.post(
      `https://groups.roblox.com/v1/groups/${groupId}/join-requests/users/${userId}`,
      {},
      { headers: { Cookie: `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrf, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    throw new Error(e.response?.data?.errors?.[0]?.message || e.message);
  }
}

module.exports = {
  getUserByUsername, getUserById, getUsersByIds, searchUsers,
  getUserPresence,
  getHeadshot, getAvatarThumbnail, getGroupIcon, getDominantColor,
  getGameInfo, getUserGames,
  getGroupInfo, getGroupMembers, getGroupWall, getUserGroups, getUserRankInGroup, getGroups,
  getUserFriends, getFriendCount,
  getUserRap,
  getCatalogItem,
  getUserBadges,
  getUserAvatar, getUserOutfits,
  getAuthenticatedUser, getCsrfToken,
  getUser, getGroup, getGroupRoles, searchCatalog, rankUser, setGroupShout, acceptJoinRequest,
};
