function requireUserId(req, res, next) {
  const ownerId = req.get('X-User-Id')?.trim();

  if (!ownerId) {
    return res.status(400).json({
      error: { code: 'USER_ID_REQUIRED', message: 'Informe o usuário no cabeçalho X-User-Id.' },
    });
  }

  req.ownerId = ownerId;
  return next();
}

module.exports = requireUserId;